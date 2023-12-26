const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { ProposalState, VoteType } = require('../../helpers/enums');
const time = require('../../helpers/time');

const TOKENS = [
  { Token: '$ERC20Votes', mode: 'blocknumber' },
  { Token: '$ERC20VotesTimestampMock', mode: 'timestamp' },
];

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const lateQuorumVoteExtension = 8n;
const quorum = ethers.parseEther('1');
const value = ethers.parseEther('1');

describe('GovernorPreventLateQuorum', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorPreventLateQuorumMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        lateQuorumVoteExtension,
        quorum,
      ]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { owner, proposer, voter1, voter2, voter3, voter4, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
        // initiate fresh proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
              value,
            },
          ],
          '<proposal description>',
        );
      });

      it('deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.equal(quorum);
        expect(await this.mock.lateQuorumVoteExtension()).to.equal(lateQuorumVoteExtension);
      });

      it('nominal workflow unaffected', async function () {
        const txPropose = await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter4).vote({ support: VoteType.Abstain });
        await this.helper.waitForDeadline();
        await this.helper.execute();

        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter3)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter4)).to.be.true;

        expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([
          ethers.parseEther('5'), // againstVotes
          ethers.parseEther('17'), // forVotes
          ethers.parseEther('2'), // abstainVotes
        ]);

        const voteStart = (await time.clockFromReceipt[mode](txPropose)) + votingDelay;
        const voteEnd = (await time.clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod;
        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(voteStart);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(voteEnd);

        await expect(txPropose)
          .to.emit(this.mock, 'ProposalCreated')
          .withArgs(
            this.proposal.id,
            this.proposer,
            this.proposal.targets,
            this.proposal.values,
            this.proposal.signatures,
            this.proposal.data,
            voteStart,
            voteEnd,
            this.proposal.description,
          );
      });

      it('Delay is extended to prevent last minute take-over', async function () {
        const txPropose = await this.helper.connect(this.proposer).propose();

        // compute original schedule
        const snapshotTimepoint = (await time.clockFromReceipt[mode](txPropose)) + votingDelay;
        const deadlineTimepoint = (await time.clockFromReceipt[mode](txPropose)) + votingDelay + votingPeriod;
        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(snapshotTimepoint);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(deadlineTimepoint);
        // wait for the last minute to vote
        await this.helper.waitForDeadline(-1n);
        const txVote = await this.helper.connect(this.voter2).vote({ support: VoteType.For });

        // cannot execute yet
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);

        // compute new extended schedule
        const extendedDeadline = (await time.clockFromReceipt[mode](txVote)) + lateQuorumVoteExtension;
        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(snapshotTimepoint);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(extendedDeadline);

        // still possible to vote
        await this.helper.connect(this.voter1).vote({ support: VoteType.Against });

        await this.helper.waitForDeadline();
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);
        await this.helper.waitForDeadline(1n);
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Defeated);

        // check extension event
        await expect(txVote).to.emit(this.mock, 'ProposalExtended').withArgs(this.proposal.id, extendedDeadline);
      });

      describe('onlyGovernance updates', function () {
        it('setLateQuorumVoteExtension is protected', async function () {
          await expect(this.mock.connect(this.owner).setLateQuorumVoteExtension(0n))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('can setLateQuorumVoteExtension through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('setLateQuorumVoteExtension', [0n]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.emit(this.mock, 'LateQuorumVoteExtensionSet')
            .withArgs(lateQuorumVoteExtension, 0n);

          expect(await this.mock.lateQuorumVoteExtension()).to.equal(0n);
        });
      });
    });
  }
});
