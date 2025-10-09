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
const quorumRatio = 8n; // percents
const superQuorumRatio = 50n; // percents
const newSuperQuorumRatio = 15n; // percents
const votingDelay = 4n;
const votingPeriod = 16n;
const value = ethers.parseEther('1');

describe('GovernorVotesSuperQuorumFraction', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorVotesSuperQuorumFractionMock', [
        name,
        votingDelay,
        votingPeriod,
        0n,
        token,
        quorumRatio,
        superQuorumRatio,
      ]);

      await owner.sendTransaction({ to: mock, value });
      await token.$_mint(owner, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(owner).delegate({ token, to: voter1, value: ethers.parseEther('30') });
      await helper.connect(owner).delegate({ token, to: voter2, value: ethers.parseEther('20') });
      await helper.connect(owner).delegate({ token, to: voter3, value: ethers.parseEther('15') });
      await helper.connect(owner).delegate({ token, to: voter4, value: ethers.parseEther('5') });

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
        await expect(this.mock.name()).to.eventually.equal(name);
        await expect(this.mock.token()).to.eventually.equal(this.token);
        await expect(this.mock.votingDelay()).to.eventually.equal(votingDelay);
        await expect(this.mock.votingPeriod()).to.eventually.equal(votingPeriod);
        await expect(this.mock.quorumNumerator()).to.eventually.equal(quorumRatio);
        await expect(this.mock.superQuorumNumerator()).to.eventually.equal(superQuorumRatio);
        await expect(this.mock.quorumDenominator()).to.eventually.equal(100n);
        await expect(time.clock[mode]().then(clock => this.mock.superQuorum(clock - 1n))).to.eventually.equal(
          (tokenSupply * superQuorumRatio) / 100n,
        );
      });

      it('proposal remains active until super quorum is reached', async function () {
        await this.helper.propose();
        await this.helper.waitForSnapshot();

        // Vote with voter1 (30%) - above quorum (8%) but below super quorum (50%)
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });

        // Check proposal is still active
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);

        // Vote with voter2 (20%) - now matches super quorum
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });

        // Proposal should no longer be active
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Succeeded);
      });

      describe('super quorum updates', function () {
        it('updateSuperQuorumNumerator is protected', async function () {
          await expect(this.mock.connect(this.owner).updateSuperQuorumNumerator(newSuperQuorumRatio))
            .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
            .withArgs(this.owner);
        });

        it('can update super quorum through governance', async function () {
          this.helper.setProposal(
            [
              {
                target: this.mock.target,
                data: this.mock.interface.encodeFunctionData('updateSuperQuorumNumerator', [newSuperQuorumRatio]),
              },
            ],
            '<proposal description>',
          );

          await this.helper.propose();
          await this.helper.waitForSnapshot();
          await this.helper.connect(this.voter1).vote({ support: VoteType.For });
          await this.helper.connect(this.voter2).vote({ support: VoteType.For });
          await this.helper.waitForDeadline();

          await expect(this.helper.execute())
            .to.emit(this.mock, 'SuperQuorumNumeratorUpdated')
            .withArgs(superQuorumRatio, newSuperQuorumRatio);

          await expect(this.mock.superQuorumNumerator()).to.eventually.equal(newSuperQuorumRatio);
        });

        it('cannot set super quorum below quorum', async function () {
          const invalidSuperQuorum = quorumRatio - 1n;

          await expect(this.mock.$_updateSuperQuorumNumerator(invalidSuperQuorum))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSuperQuorumTooSmall')
            .withArgs(invalidSuperQuorum, quorumRatio);
        });

        it('cannot set super quorum above denominator', async function () {
          const denominator = await this.mock.quorumDenominator();
          const invalidSuperQuorum = BigInt(denominator) + 1n;

          await expect(this.mock.$_updateSuperQuorumNumerator(invalidSuperQuorum))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidSuperQuorumFraction')
            .withArgs(invalidSuperQuorum, denominator);
        });

        it('cannot set quorum above super quorum', async function () {
          const invalidQuorum = superQuorumRatio + 1n;

          await expect(this.mock.$_updateQuorumNumerator(invalidQuorum))
            .to.be.revertedWithCustomError(this.mock, 'GovernorInvalidQuorumTooLarge')
            .withArgs(invalidQuorum, superQuorumRatio);
        });
      });
    });
  }
});
