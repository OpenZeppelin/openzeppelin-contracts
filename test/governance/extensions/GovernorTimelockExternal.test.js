const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Enums = require('../../helpers/enums');

const {
  runGovernorWorkflow,
} = require('../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Timelock = artifacts.require('TimelockController');
const Governance = artifacts.require('GovernorTimelockExternalMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('GovernorTimelockExternal', function (accounts) {
  const [ voter ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    const [ deployer ] = await web3.eth.getAccounts();

    this.token = await Token.new(tokenName, tokenSymbol);
    this.timelock = await Timelock.new(3600, [], []);
    this.governor = await Governance.new(name, version, this.token.address, this.timelock.address);
    this.receiver = await CallReceiver.new();
    // normal setup: governor is proposer, everyone is executor, timelock is its own admin
    await this.timelock.grantRole(await this.timelock.PROPOSER_ROLE(), this.governor.address);
    await this.timelock.grantRole(await this.timelock.EXECUTOR_ROLE(), constants.ZERO_ADDRESS);
    await this.timelock.revokeRole(await this.timelock.TIMELOCK_ADMIN_ROLE(), deployer);
    await this.token.mint(voter, tokenSupply);
    await this.token.delegate(voter, { from: voter });
  });

  it('post deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');

    expect(await this.governor.timelock()).to.be.equal(this.timelock.address);
  });

  describe('nominal', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          queue: { delay: 3600 },
        },
      };
    });
    afterEach(async () => {
      const timelockid = await this.timelock.hashOperationBatch(
        ...this.settings.proposal.slice(0, 3),
        '0x0',
        this.settings.proposal[3],
      );

      expectEvent(
        this.receipts.propose,
        'ProposalCreated',
        { proposalId: this.id, votingDeadline: this.deadline },
      );
      expectEvent(
        this.receipts.queue,
        'ProposalQueued',
        { proposalId: this.id },
      );
      expectEvent.inTransaction(
        this.receipts.queue.transactionHash,
        this.timelock,
        'CallScheduled',
        { id: timelockid },
      );
      expectEvent(
        this.receipts.execute,
        'ProposalExecuted',
        { proposalId: this.id },
      );
      expectEvent.inTransaction(
        this.receipts.execute.transactionHash,
        this.timelock,
        'CallExecuted',
        { id: timelockid },
      );
      expectEvent.inTransaction(
        this.receipts.execute.transactionHash,
        this.receiver,
        'MockFunctionCalled',
      );
    });
    runGovernorWorkflow();
  });

  describe('not queued', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          queue: { enable: false },
          execute: { reason: 'TimelockController: operation is not ready' },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
    });
    runGovernorWorkflow();
  });

  describe('to early', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          execute: { reason: 'TimelockController: operation is not ready' },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);
    });
    runGovernorWorkflow();
  });

  describe('re-queue / re-execute', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          queue: { delay: 3600 },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);

      await expectRevert(
        this.governor.queue(...this.settings.proposal.slice(0, -1)),
        'Governance: proposal not ready',
      );
      await expectRevert(
        this.governor.execute(...this.settings.proposal.slice(0, -1)),
        'TimelockController: operation is not ready',
      );
    });
    runGovernorWorkflow();
  });

  describe('cancel before queue prevents scheduling', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          queue: { enable: false },
          execute: { enable: false },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);

      expectEvent(
        await this.governor.cancel(...this.settings.proposal.slice(0, -1)),
        'ProposalCanceled',
        { proposalId: this.id },
      );

      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

      await expectRevert(
        this.governor.queue(...this.settings.proposal.slice(0, -1)),
        'Governance: proposal not ready',
      );
    });
    runGovernorWorkflow();
  });

  describe('cancel after queue prevents executin', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ web3.utils.toWei('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
          '<proposal description>',
        ],
        voters: [
          { address: voter, support: Enums.VoteType.For },
        ],
        steps: {
          queue: { delay: 3600 },
          execute: { enable: false },
        },
      };
    });
    afterEach(async () => {
      const timelockid = await this.timelock.hashOperationBatch(
        ...this.settings.proposal.slice(0, 3),
        '0x0',
        this.settings.proposal[3],
      );

      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Queued);

      const receipt = await this.governor.cancel(...this.settings.proposal.slice(0, -1));
      expectEvent(
        receipt,
        'ProposalCanceled',
        { proposalId: this.id },
      );
      expectEvent.inTransaction(
        receipt.receipt.transactionHash,
        this.timelock,
        'Cancelled',
        { id: timelockid },
      );

      expect(await this.governor.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

      await expectRevert(
        this.governor.execute(...this.settings.proposal.slice(0, -1)),
        'TimelockController: operation is not ready',
      );
    });
    runGovernorWorkflow();
  });

  describe('updateTimelock', () => {
    beforeEach(async () => {
      this.newTimelock = await Timelock.new(3600, [], []);
    });

    it('protected', async () => {
      await expectRevert(
        this.governor.updateTimelock(this.newTimelock.address),
        'GovernorWithTimelockExternal: caller must be timelock',
      );
    });

    describe('using workflow', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.governor.address ],
            [ web3.utils.toWei('0') ],
            [ this.governor.contract.methods.updateTimelock(this.newTimelock.address).encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          voters: [
            { address: voter, support: Enums.VoteType.For },
          ],
          steps: {
            queue: { delay: 3600 },
          },
        };
      });
      afterEach(async () => {
        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id, votingDeadline: this.deadline },
        );
        expectEvent(
          this.receipts.execute,
          'ProposalExecuted',
          { proposalId: this.id },
        );
        expectEvent(
          this.receipts.execute,
          'TimelockChange',
          { oldTimelock: this.timelock.address, newTimelock: this.newTimelock.address },
        );
        expect(await this.governor.timelock()).to.be.bignumber.equal(this.newTimelock.address);
      });
      runGovernorWorkflow();
    });
  });
});
