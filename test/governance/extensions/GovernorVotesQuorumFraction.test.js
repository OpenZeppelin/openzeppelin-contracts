const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');

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
const ratio = 8n; // percents
const newRatio = 6n; // percents
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorVotesQuorumFraction', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();

      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorMock', [name, votingDelay, votingPeriod, 0n, token, ratio]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { owner, voter1, voter2, voter3, voter4, receiver, token, mock, helper };
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
        expect(await this.mock.quorum(0)).to.equal(0n);
        expect(await this.mock.quorumNumerator()).to.equal(ratio);
        expect(await this.mock.quorumDenominator()).to.equal(100n);
        expect(await time.clock[mode]().then(clock => this.mock.quorum(clock - 1n))).to.equal(
          (tokenSupply * ratio) / 100n,
        );
      });

      it('quorum reached', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.execute();
      });

      it('quorum not reached', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await expect(this.helper.execute())
          .to.be.revertedWithCustomError(this.mock, 'GovernorUnexpectedProposalState')
          .withArgs(
            this.proposal.id,
            ProposalState.Defeated,
            GovernorHelper.proposalStatesToBitMap([ProposalState.Succeeded, ProposalState.Queued]),
          );
      });

      describe('onlyGovernance updates', function () {
        it('updateQuorumNumerator is protected', async function () {
          await expect(this.mock.connect(this.owner).updateQuorumNumerator(newRatio))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('can updateQuorumNumerator through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('updateQuorumNumerator', [newRatio]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute()).to.emit(this.mock, 'QuorumNumeratorUpdated').withArgs(ratio, newRatio);

          expect(await this.mock.quorumNumerator()).to.equal(newRatio);
          expect(await this.mock.quorumDenominator()).to.equal(100n);

          // it takes one block for the new quorum to take effect
          expect(await time.clock[mode]().then(blockNumber => this.mock.quorum(blockNumber - 1n))).to.equal(
            (tokenSupply * ratio) / 100n,
          );

          await mine();

          expect(await time.clock[mode]().then(blockNumber => this.mock.quorum(blockNumber - 1n))).to.equal(
            (tokenSupply * newRatio) / 100n,
          );
        });

        it('cannot updateQuorumNumerator over the maximum', async function () {
          const quorumNumerator = 101n;
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('updateQuorumNumerator', [quorumNumerator]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          const quorumDenominator = await this.mock.quorumDenominator();

          await expect(this.helper.execute())
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidQuorumFraction')
            .withArgs(quorumNumerator, quorumDenominator);
        });
      });
    });
  }
});
