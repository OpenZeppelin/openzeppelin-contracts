const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { GovernorHelper } = require('../../helpers/governance');
const { VoteType } = require('../../helpers/enums');
const { sum } = require('../../helpers/math');

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
const value = ethers.parseEther('1');

describe('GovernorCountingFractional', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, proposer, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, version]);
      const mock = await ethers.deployContract('$GovernorFractionalMock', [
        name, // name
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token, // tokenAddress
        10n, // quorumNumeratorValue
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
        expect(await this.mock.COUNTING_MODE()).to.equal(
          'support=bravo,fractional&quorum=for,abstain&params=fractional',
        );
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

      describe('voting with a fraction of the weight', function () {
        it('revert if params spend more than available', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();

          const weight = ethers.parseEther('7');
          const fractional = ['0', '1000', '0'].map(ethers.parseEther);

          await expect(
            this.helper.connect(this.voter2).vote({
              support: VoteType.Parameters,
              reason: 'no particular reason',
              params: ethers.solidityPacked(['uint128', 'uint128', 'uint128'], fractional),
            }),
          )
            .to.be.revertedWithCustomError(this.mock, 'GovernorExceedRemainingWeight')
            .withArgs(this.voter2, sum(...fractional), weight);
        });

        it('revert if no weight remaining', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter2).vote({ support: VoteType.For });

          await expect(
            this.helper.connect(this.voter2).vote({
              support: VoteType.Parameters,
              reason: 'no particular reason',
              params: ethers.solidityPacked(['uint128', 'uint128', 'uint128'], [0n, 1n, 0n]),
            }),
          )
            .to.be.revertedWithCustomError(this.mock, 'GovernorAlreadyCastVote')
            .withArgs(this.voter2);
        });

        it('revert if params are not properly formatted #1', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();

          await expect(
            this.helper.connect(this.voter2).vote({
              support: VoteType.Parameters,
              reason: 'no particular reason',
              params: ethers.solidityPacked(['uint128', 'uint128'], [0n, 1n]),
            }),
          ).to.be.revertedWithCustomError(this.mock, 'GovernorInvalidVoteParams');
        });

        it('revert if params are not properly formatted #2', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();

          await expect(
            this.helper.connect(this.voter2).vote({
              support: VoteType.Against,
              reason: 'no particular reason',
              params: ethers.solidityPacked(['uint128', 'uint128', 'uint128'], [0n, 1n, 0n]),
            }),
          ).to.be.revertedWithCustomError(this.mock, 'GovernorInvalidVoteParams');
        });

        it('revert if vote type is invalid', async function () {
          await this.helper.connect(this.proposer).propose();
          await this.helper.waitForSnapshot();

          await expect(this.helper.connect(this.voter2).vote({ support: 128n })).to.be.revertedWithCustomError(
            this.mock,
            'GovernorInvalidVoteType',
          );
        });
      });
    });
  }
});
