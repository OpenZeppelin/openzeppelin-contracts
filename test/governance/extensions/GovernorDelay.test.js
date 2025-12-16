const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

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
const value = ethers.parseEther('1');
const initialDelay = time.duration.hours(1n);

describe('GovernorDelay', function () {
  for (const { Token, mode } of TOKENS) {
    const fixture = async () => {
      const [admin, voter1, voter2, voter3, voter4, other] = await ethers.getSigners();
      const receiver = await ethers.deployContract('CallReceiverMock');

      const token = await ethers.deployContract(Token, [tokenName, tokenSymbol, tokenName, version]);
      const mock = await ethers.deployContract('$GovernorDelayMock', [
        name,
        votingDelay,
        votingPeriod,
        0n,
        initialDelay,
        token,
        0n,
      ]);

      await admin.sendTransaction({ to: mock, value });
      await token.$_mint(admin, tokenSupply);

      const helper = new GovernorHelper(mock, mode);
      await helper.connect(admin).delegate({ token, to: voter1, value: ethers.parseEther('10') });
      await helper.connect(admin).delegate({ token, to: voter2, value: ethers.parseEther('7') });
      await helper.connect(admin).delegate({ token, to: voter3, value: ethers.parseEther('5') });
      await helper.connect(admin).delegate({ token, to: voter4, value: ethers.parseEther('2') });

      return { admin, voter1, voter2, voter3, voter4, other, receiver, token, mock, helper };
    };

    describe(`using ${Token}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      it('post deployment check', async function () {
        expect(await this.mock.name()).to.equal(name);
        expect(await this.mock.token()).to.equal(this.token);
        expect(await this.mock.votingDelay()).to.equal(votingDelay);
        expect(await this.mock.votingPeriod()).to.equal(votingPeriod);
        expect(await this.mock.quorum(0n)).to.equal(0n);
        expect(await this.mock.delay()).to.equal(initialDelay);
      });

      it('sets delay through governance', async function () {
        const newDelay = time.duration.hours(2n);

        // Only through governance
        await expect(this.mock.connect(this.voter1).setDelay(newDelay))
          .to.be.revertedWithCustomError(this.mock, 'GovernorOnlyExecutor')
          .withArgs(this.voter1);

        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setDelay', [newDelay]),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();

        await expect(this.helper.execute())
          .to.emit(this.mock, 'DelaySet')
          .withArgs(initialDelay, newDelay);

        expect(await this.mock.delay()).to.equal(newDelay);
      });

      it('does not need to queue proposals with zero delay', async function () {
        // Set delay to 0 through governance
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setDelay', [0n]),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();
        await this.helper.execute();

        // Now create a new proposal
        this.proposal2 = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr2',
        );

        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.helper.currentProposal.id)).to.be.false;
      });

      it('needs to queue proposals with non-zero delay', async function () {
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        expect(await this.mock.proposalNeedsQueuing(this.helper.currentProposal.id)).to.be.true;
      });

      it('queues proposal and sets ETA correctly', async function () {
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();

        const queueTx = this.helper.queue();
        const proposalId = this.helper.currentProposal.id;
        await expect(queueTx)
          .to.emit(this.mock, 'ProposalQueued')
          .withArgs(proposalId, anyValue);

        const eta = await this.mock.proposalEta(proposalId);
        expect(eta).to.be.gt(0n);
        const currentTime = await time.clock.timestamp();
        expect(eta).to.be.gte(currentTime + initialDelay);
      });

      it('executes proposal after delay has elapsed', async function () {
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();

        await expect(this.helper.execute())
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.helper.currentProposal.id)
          .to.emit(this.receiver, 'MockFunctionCalled');
      });

      it('reverts when executing proposal before delay has elapsed', async function () {
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();

        // Try to execute immediately without waiting
        const proposalId = this.helper.currentProposal.id;
        await expect(this.helper.execute())
          .to.be.revertedWithCustomError(this.mock, 'GovernorUnmetDelay')
          .withArgs(proposalId, await this.mock.proposalEta(proposalId));
      });

      it('allows immediate execution when delay is zero', async function () {
        // Set delay to 0
        this.proposal1 = await this.helper.setProposal(
          [
            {
              target: this.mock.target,
              data: this.mock.interface.encodeFunctionData('setDelay', [0n]),
            },
          ],
          'descr1',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();
        await this.helper.queue();
        await this.helper.waitForEta();
        await this.helper.execute();

        // Now create a new proposal - should execute immediately
        this.proposal2 = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr2',
        );

        await this.helper.propose();
        await this.helper.waitForSnapshot();
        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline();

        // Should be able to execute directly without queuing
        expect(await this.mock.proposalNeedsQueuing(this.helper.currentProposal.id)).to.be.false;
        await expect(this.helper.execute())
          .to.emit(this.mock, 'ProposalExecuted')
          .withArgs(this.helper.currentProposal.id)
          .to.emit(this.receiver, 'MockFunctionCalled');
      });

      it('proposal state transitions correctly with delay', async function () {
        this.proposal = await this.helper.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr',
        );

        await this.helper.propose();
        const proposalId = this.helper.currentProposal.id;
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Pending);

        await this.helper.waitForSnapshot(1n); // Add 1 to ensure we're past the snapshot
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Active);

        await this.helper.connect(this.voter1).vote({ support: VoteType.For });
        await this.helper.waitForDeadline(1n); // Add 1 to ensure we're past the deadline
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Succeeded);

        await this.helper.queue();
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Queued);

        await this.helper.waitForEta();
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Queued);

        await this.helper.execute();
        expect(await this.mock.state(proposalId)).to.equal(ProposalState.Executed);
      });

      it('handles multiple proposals with delay correctly', async function () {
        // First proposal
        const helper1 = new GovernorHelper(this.mock, mode);
        await helper1.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr1',
        );

        await helper1.propose();
        const proposalId1 = helper1.currentProposal.id;
        await helper1.waitForSnapshot();
        await helper1.connect(this.voter1).vote({ support: VoteType.For });
        await helper1.waitForDeadline();
        await helper1.queue();
        const eta1 = await this.mock.proposalEta(proposalId1);

        // Second proposal
        const helper2 = new GovernorHelper(this.mock, mode);
        await helper2.setProposal(
          [
            {
              target: this.receiver.target,
              data: this.receiver.interface.encodeFunctionData('mockFunction'),
            },
          ],
          'descr2',
        );

        await helper2.propose();
        const proposalId2 = helper2.currentProposal.id;
        await helper2.waitForSnapshot();
        await helper2.connect(this.voter1).vote({ support: VoteType.For });
        await helper2.waitForDeadline();
        await helper2.queue();
        const eta2 = await this.mock.proposalEta(proposalId2);

        // Both should have valid ETAs
        expect(eta1).to.be.gt(0n);
        expect(eta2).to.be.gt(0n);
        expect(eta2).to.be.gte(eta1);

        // Wait for first proposal's ETA and execute
        await time.increaseTo.timestamp(eta1);
        await helper1.execute();

        // Wait for second proposal's ETA and execute
        await time.increaseTo.timestamp(eta2);
        await helper2.execute();
      });
    });
  }
});

