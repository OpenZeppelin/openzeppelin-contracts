const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');

const TOKENS = [
  { Token: '$ERC20VotesOverridableMock', mode: 'blocknumber' },
  { Token: '$ERC20VotesOverridableTimestampMock', mode: 'timestamp' },
];

const name = 'Override Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorOverrideDelegateVote', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorOverrideDelegateVoteMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        10n, // quorumNumeratorValue
        token, // tokenAddress
      ]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { owner, proposer, voter1, voter2, voter3, voter4, other, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        // default proposal
        this.proposal = this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              value,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
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
        expect(await this.mock.COUNTING_MODE()).to.equal('support=bravo,override&quorum=for,abstain&params=override');
      });

      it('nominal is unaffected', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For, reason: 'This is nice' });
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter4).vote({ support: VoteType.Abstain });
        await this.helper.waitForDeadline();
        await this.helper.execute();

        expect(await this.mock.hasVoted(this.proposal.id, this.owner)).to.be.false;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter1)).to.be.true;
        expect(await this.mock.hasVoted(this.proposal.id, this.voter2)).to.be.true;
        expect(await ethers.provider.getBalance(this.mock)).to.equal(0n);
        expect(await ethers.provider.getBalance(this.receiver)).to.equal(value);
      });

      describe('override vote', async function () {
        beforeEach(async function () {
          await this.token.connect(this.voter1).delegate(this.voter2);
          await this.token.connect(this.voter4).delegate(this.voter2);
          await mine();

          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();
        });
        it('override delegate after delegate vote', async function () {
          await expect(this.helper.connect(this.voter2).vote({ support: VoteType.For }))
            .to.emit(this.mock, 'VoteCast')
            .withArgs(this.voter2, this.helper.id, VoteType.For, ethers.parseEther('19'), '');
          expect(await this.mock.proposalVotes(this.helper.id)).to.deep.eq([0, ethers.parseEther('19'), 0]);

          await expect(
            this.helper
              .connect(this.voter1)
              .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' }),
          )
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(
              this.voter1,
              this.helper.id,
              VoteType.Against,
              ethers.parseEther('10'),
              '',
              ethers.solidityPacked(['bytes4', 'address'], ['0x23b70c8d', this.voter2.address]),
            );

          expect(await this.mock.proposalVotes(this.helper.id)).to.deep.eq([
            ethers.parseEther('10'),
            ethers.parseEther('9'),
            0,
          ]);
        });

        it('override delegate before delegate vote', async function () {
          await expect(
            this.helper
              .connect(this.voter1)
              .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' }),
          )
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(
              this.voter1,
              this.helper.id,
              VoteType.Against,
              ethers.parseEther('10'),
              '',
              ethers.solidityPacked(['bytes4', 'address'], ['0x23b70c8d', ethers.ZeroAddress]),
            );
          expect(await this.mock.proposalVotes(this.helper.id)).to.deep.eq([ethers.parseEther('10'), 0, 0]);
          expect(await this.mock.hasVotedOverride(this.helper.id, this.voter1)).to.be.true;
          expect(await this.mock.hasVoted(this.helper.id, this.voter1)).to.be.false;

          await expect(this.helper.connect(this.voter2).vote({ support: VoteType.For }))
            .to.emit(this.mock, 'VoteCast')
            .withArgs(this.voter2, this.helper.id, VoteType.For, ethers.parseEther('9'), '');
          expect(await this.mock.proposalVotes(this.helper.id)).to.deep.eq([
            ethers.parseEther('10'),
            ethers.parseEther('9'),
            0,
          ]);
          expect(await this.mock.hasVotedOverride(this.helper.id, this.voter2)).to.be.false;
          expect(await this.mock.hasVoted(this.helper.id, this.voter2)).to.be.true;
        });

        it('override delegate before and after delegate vote', async function () {
          await expect(
            this.helper
              .connect(this.voter1)
              .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' }),
          )
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(
              this.voter1,
              this.helper.id,
              VoteType.Against,
              ethers.parseEther('10'),
              '',
              ethers.solidityPacked(['bytes4', 'address'], ['0x23b70c8d', ethers.ZeroAddress]),
            );

          await expect(this.helper.connect(this.voter2).vote({ support: VoteType.For }))
            .to.emit(this.mock, 'VoteCast')
            .withArgs(this.voter2, this.helper.id, VoteType.For, ethers.parseEther('9'), '');

          await expect(
            this.helper
              .connect(this.voter4)
              .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' }),
          )
            .to.emit(this.mock, 'VoteCastWithParams')
            .withArgs(
              this.voter4,
              this.helper.id,
              VoteType.Against,
              ethers.parseEther('2'),
              '',
              ethers.solidityPacked(['bytes4', 'address'], ['0x23b70c8d', this.voter2.address]),
            );

          expect(await this.mock.proposalVotes(this.helper.id)).to.deep.eq([
            ethers.parseEther('12'),
            ethers.parseEther('7'),
            0,
          ]);
        });

        it('can not override vote twice', async function () {
          await this.helper
            .connect(this.voter1)
            .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' });
          await expect(
            this.helper
              .connect(this.voter1)
              .vote({ support: VoteType.Against, params: '0x23b70c8d0000000000000000000000000000000000000000' }),
          )
            .to.be.revertedWithCustomError(this.mock, 'GovernorAlreadyCastVoteOverride')
            .withArgs(this.voter1.address);
        });
      });
    });
  }
});
