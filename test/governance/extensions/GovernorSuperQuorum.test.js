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

const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
const PROPOSER_ROLE = ethers.id('PROPOSER_ROLE');
const EXECUTOR_ROLE = ethers.id('EXECUTOR_ROLE');
const CANCELLER_ROLE = ethers.id('CANCELLER_ROLE');

const name = 'OZ-Governor';
const version = '1';
const tokenName = 'MockToken';
const tokenSymbol = 'MTKN';
const tokenSupply = ethers.parseEther('100');
const votingDelay = 4n;
const votingPeriod = 16n;
const quorum = 10n;
const superQuorum = 40n;
const value = ethers.parseEther('1');
const delay = time.duration.hours(1n);

describe('GovernorSuperQuorum', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [proposer, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const timelock = await ethers.deployContract('TimelockController', [delay, [], [], proposer]);
      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorSuperQuorumMock', [
        name,
        votingDelay, // initialVotingDelay
        votingPeriod, // initialVotingPeriod
        0n, // initialProposalThreshold
        token,
        timelock,
        quorum,
        superQuorum,
      ]);

      await proposer.sendTransaction({ to: timelock, value });
      await token.$_mint(proposer, tokenSupply);
      await timelock.grantRole(PROPOSER_ROLE, mock);
      await timelock.grantRole(PROPOSER_ROLE, proposer);
      await timelock.grantRole(CANCELLER_ROLE, mock);
      await timelock.grantRole(CANCELLER_ROLE, proposer);
      await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
      await timelock.revokeRole(DEFAULT_ADMIN_ROLE, proposer);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(proposer).delegate({ token, to: voter1, value: 40 });
      await helper.connect(proposer).delegate({ token, to: voter2, value: 30 });
      await helper.connect(proposer).delegate({ token, to: voter3, value: 20 });
      await helper.connect(proposer).delegate({ token, to: voter4, value: 15 });
      await helper.connect(proposer).delegate({ token, to: voter5, value: 5 });

      return { proposer, voter1, voter2, voter3, voter4, voter5, receiver, token, mock, timelock, helper };
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
        await expect(this.mock.quorum(0)).to.eventually.equal(quorum);
        await expect(this.mock.superQuorum(0)).to.eventually.equal(superQuorum);
      });

      it('proposal succeeds early when super quorum is reached', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();

        // Vote with voter2 (30) - above quorum (10) but below super quorum (40)
        await this.helper.connect(this.voter2).vote({ support: VoteType.For });
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);

        // Vote with voter3 (20) to reach super quorum (50 total > 40)
        await this.helper.connect(this.voter3).vote({ support: VoteType.For });

        await expect(this.mock.proposalEta(this.proposal.id)).to.eventually.equal(0);

        // Should be succeeded since we reached super quorum and no eta is set
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Succeeded);
      });

      it('proposal remains active if super quorum is not reached', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();

        // Vote with voter4 (15) - below super quorum (40) but above quorum (10)
        await this.helper.connect(this.voter4).vote({ support: VoteType.For });
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);

        // Vote with voter5 (5) - still below super quorum (total 20 < 40)
        await this.helper.connect(this.voter5).vote({ support: VoteType.For });
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);

        // Wait for deadline
        await this.helper.waitForDeadline(1n);

        // Should succeed since deadline passed and we have enough support (20 > 10 quorum)
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Succeeded);
      });

      it('proposal remains active if super quorum is reached but vote fails', async function () {
        await this.helper.connect(this.proposer).propose();
        await this.helper.waitForSnapshot();

        // Vote against with voter2 and voter3 (50)
        await this.helper.connect(this.voter2).vote({ support: VoteType.Against });
        await this.helper.connect(this.voter3).vote({ support: VoteType.Against });

        // Vote for with voter1 (40) (reaching super quorum)
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });

        // should be active since super quorum is reached but vote fails
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Active);

        // wait for deadline
        await this.helper.waitForDeadline(1n);

        // should be defeated since against votes are higher
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Defeated);
      });

      it('proposal is queued if super quorum is reached and eta is set', async function () {
        await this.helper.connect(this.proposer).propose();

        await this.helper.waitForSnapshot();

        // Vote with voter1 (40) - reaching super quorum
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });

        await this.helper.queue();

        // Queueing should set eta
        await expect(this.mock.proposalEta(this.proposal.id)).to.eventually.not.equal(0);

        // Should be queued since we reached super quorum and eta is set
        await expect(this.mock.state(this.proposal.id)).to.eventually.equal(ProposalState.Queued);
      });
    });
  }
});
