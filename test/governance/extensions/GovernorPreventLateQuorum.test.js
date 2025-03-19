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
    describe(`Using token implementation: ${Token}`, function () {
      // Deploy contracts and set up initial state using a fixture
      const fixture = async () => {
        const [owner, proposer, voter1, voter2, voter3, voter4] = await ethers.getSigners();

        // Deploy a mock receiver contract for proposal execution simulation
        const receiver = await ethers.deployContract('CallReceiverMock');

        // Deploy the token contract
        const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);

        // Deploy the Governor contract with the late quorum extension feature
        const mock = await ethers.deployContract('$GovernorPreventLateQuorumMock', [
          name, // Governor name
          votingDelay, // Initial voting delay
          votingPeriod, // Initial voting period
          0n, // Initial proposal threshold
          token, // Token address for voting power
          lateQuorumVoteExtension, // Late quorum vote extension duration
          quorum, // Required quorum
        ]);

        // Fund the governor contract (if needed for execution)
        await owner.sendTransaction({ to: mock, value });

        // Mint tokens for voting
        await token.$_mint(owner, tokenSupply);

        // Create a governor helper instance to simplify proposal/voting processes
        const helper = new GovernorHelper(mock, mode);

        // Delegate voting power to the voters
        await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
        await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
        await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
        await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

        return { owner, proposer, voter1, voter2, voter3, voter4, receiver, token, mock, helper };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        // Create a fresh proposal for each test
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

      it('Deployment check', async function () {
        // Validate initial parameters of the governor contract
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0)).to.equal(quorum);
        expect(await this.mock.lateQuorumVoteExtension()).to.equal(lateQuorumVoteExtension);
      });

      it('Nominal workflow is unaffected by late quorum extension', async function () {
        // Propose a new proposal
        const txPropose = await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();

        // Cast votes from different voters
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter4).vote({ support: VoteType.Abstain });
        await this.helper.waitForDeadline();

        // Execute the proposal
        await this.helper.execute();

        // Verify voting participation
        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter3)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter4)).to.be.true;

        // Validate vote counts in the order [against, for, abstain]
        expect(await this.mock.proposalVotes(this.proposal.id)).to.deep.equal([
          ethers.parseEther('5'),
          ethers.parseEther('17'),
          ethers.parseEther('2'),
        ]);

        // Validate proposal timeline (snapshot and deadline)
        const proposalTimestamp = await time.clockFromReceipt[mode](txPropose);
        const voteStart = proposalTimestamp + votingDelay;
        const voteEnd = proposalTimestamp + votingDelay + votingPeriod;

        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(voteStart);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(voteEnd);

        // Check that the ProposalCreated event was emitted with correct parameters
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

      it('Extends voting deadline when a last minute vote is cast', async function () {
        const txPropose = await this.helper.connect(this.proposer).propose();

        // Calculate original proposal timeline based on transaction timestamp
        const proposalTimestamp = await time.clockFromReceipt[mode](txPropose);
        const snapshotTimepoint = proposalTimestamp + votingDelay;
        const deadlineTimepoint = proposalTimestamp + votingDelay + votingPeriod;

        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(snapshotTimepoint);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(deadlineTimepoint);

        // Wait until just before the original deadline
        await this.helper.waitForDeadline(-1n);

        // Cast a last-minute vote that should trigger an extension
        const txVote = await this.helper.connect(this.voter2).vote({ support: VoteType.For });

        // The proposal should still be active (voting period extended)
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);

        // Compute the new extended deadline
        const extendedDeadline = (await time.clockFromReceipt[mode](txVote)) + lateQuorumVoteExtension;
        expect(await this.mock.proposalSnapshot(this.proposal.id)).to.equal(snapshotTimepoint);
        expect(await this.mock.proposalDeadline(this.proposal.id)).to.equal(extendedDeadline);

        // Allow additional votes during the extended period
        await this.helper.connect(this.voter1).vote({ support: VoteType.Against });
        await this.helper.waitForDeadline();

        // Before the final extension, the proposal remains active
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Active);

        // After the extended period, the proposal should transition to a final state
        await this.helper.waitForDeadline(1n);
        expect(await this.mock.state(this.proposal.id)).to.equal(ProposalState.Defeated);

        // Verify that the ProposalExtended event was emitted correctly
        await expect(txVote).to.emit(this.mock, 'ProposalExtended').withArgs(this.proposal.id, extendedDeadline);
      });

      describe('onlyGovernance updates', function () {
        it('setLateQuorumVoteExtension is protected from unauthorized calls', async function () {
          await expect(this.mock.connect(this.owner).setLateQuorumVoteExtension(0n))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('Allows updating late quorum extension through a governance proposal', async function () {
          // Set up a proposal to update the late quorum vote extension to 0
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

          // Execute the proposal and verify the event and state change
          await expect(this.helper.execute())
            .to.emit(this.mock, 'LateQuorumVoteExtensionSet')
            .withArgs(lateQuorumVoteExtension, 0n);
          expect(await this.mock.lateQuorumVoteExtension()).to.equal(0n);
        });
      });
    });
  }
});
