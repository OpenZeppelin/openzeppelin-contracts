const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const {
  runGovernorWorkflow,
} = require('../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Timelock = artifacts.require('TimelockController');
const Governance = artifacts.require('GovernorWithTimelockExternalMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governance', function (accounts) {
  const [ voter ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.token = await Token.new(tokenName, tokenSymbol, voter, tokenSupply);
    this.timelock = await Timelock.new(3600, [], []);
    this.governor = await Governance.new(name, version, this.token.address, this.timelock.address);
    this.receiver = await CallReceiver.new();
    await this.timelock.grantRole(await this.timelock.PROPOSER_ROLE(), this.governor.address);
    await this.timelock.grantRole(await this.timelock.EXECUTOR_ROLE(), this.governor.address);
    await this.token.delegate(voter, { from: voter });
  });

  it('post deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governor.requiredScore()).to.be.bignumber.equal('50');
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          queue: { enable: true, delay: 3600 },
        },
        after: async () => {
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
        },
      };
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          queue: { enable: true },
          execute: { reason: 'TimelockController: operation is not ready' },
        },
      };
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          queue: { enable: true, delay: 3600 },
        },
        after: async () => {
          await expectRevert(
            this.governor.queue(...this.settings.proposal.slice(0, -1)),
            'Governance: proposal not ready',
          );
          await expectRevert(
            this.governor.execute(...this.settings.proposal.slice(0, -1)),
            'TimelockController: operation is not ready',
          );
        },
      };
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          execute: { enable: false },
        },
        after: async () => {
          expectEvent(
            await this.governor.cancel(...this.settings.proposal.slice(0, -1)),
            'ProposalCanceled',
            { proposalId: this.id },
          );
          await expectRevert(
            this.governor.queue(...this.settings.proposal.slice(0, -1)),
            'Governance: proposal not ready',
          );
        },
      };
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          queue: { enable: true, delay: 3600 },
          execute: { enable: false },
        },
        after: async () => {
          const timelockid = await this.timelock.hashOperationBatch(
            ...this.settings.proposal.slice(0, 3),
            '0x0',
            this.settings.proposal[3],
          );

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
          await expectRevert(
            this.governor.execute(...this.settings.proposal.slice(0, -1)),
            'TimelockController: operation is not ready',
          );
        },
      };
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
            { address: voter, support: new BN('100') },
          ],
          steps: {
            queue: { enable: true, delay: 3600 },
          },
          after: async () => {
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
          },
        };
      });
      runGovernorWorkflow();
    });
  });
});
