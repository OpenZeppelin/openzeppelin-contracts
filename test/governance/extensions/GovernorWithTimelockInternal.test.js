const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const {
  runGovernorWorkflow,
} = require('../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Governance = artifacts.require('GovernorWithTimelockInternalMock');
const CallReceiver = artifacts.require('CallReceiverMock');

const PROPOSAL_STATE = [
  'Pending',
  'Active',
  'Canceled',
  'Defeated',
  'Succeeded',
  'Queued',
  'Expired',
  'Executed',
].reduce((acc, key, i) => ({ ...acc, [key]: new BN(i) }), {});

contract('Governance', function (accounts) {
  const [ voter ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.token = await Token.new(tokenName, tokenSymbol, voter, tokenSupply);
    this.governor = await Governance.new(name, version, this.token.address, 3600);
    this.receiver = await CallReceiver.new();
    await this.token.delegate(voter, { from: voter });
  });

  it('post deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governor.requiredScore()).to.be.bignumber.equal('50');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');

    expect(await this.governor.timelock()).to.be.equal(this.governor.address);
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
      };
    });
    afterEach(async () => {
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
      expectEvent(
        this.receipts.execute,
        'ProposalExecuted',
        { proposalId: this.id },
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          execute: { reason: 'Governance: proposal timelock not ready' },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Succeeded);
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
          execute: { reason: 'Governance: proposal timelock not ready' },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Queued);
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
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Executed);

      await expectRevert(
        this.governor.queue(...this.settings.proposal.slice(0, -1)),
        'Governance: proposal not ready',
      );
      await expectRevert(
        this.governor.execute(...this.settings.proposal.slice(0, -1)),
        'Governance: proposal timelock not ready',
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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          execute: { enable: false },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Succeeded);

      expectEvent(
        await this.governor.cancel(...this.settings.proposal.slice(0, -1)),
        'ProposalCanceled',
        { proposalId: this.id },
      );

      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

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
          { address: voter, support: new BN('100') },
        ],
        steps: {
          queue: { enable: true, delay: 3600 },
          execute: { enable: false },
        },
      };
    });
    afterEach(async () => {
      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Queued);

      expectEvent(
        await this.governor.cancel(...this.settings.proposal.slice(0, -1)),
        'ProposalCanceled',
        { proposalId: this.id },
      );

      expect(await this.governor.state(this.id)).to.be.bignumber.equal(PROPOSAL_STATE.Canceled);

      await expectRevert(
        this.governor.execute(...this.settings.proposal.slice(0, -1)),
        'Governance: proposal timelock not ready',
      );
    });
    runGovernorWorkflow();
  });

  describe('updateDelay', () => {
    it('protected', async () => {
      await expectRevert(this.governor.updateDelay(0), 'GovernorWithTimelockInternal: caller must be governor');
    });

    describe('using workflow', () => {
      beforeEach(async () => {
        this.settings = {
          proposal: [
            [ this.governor.address ],
            [ web3.utils.toWei('0') ],
            [ this.governor.contract.methods.updateDelay(7200).encodeABI() ],
            web3.utils.randomHex(32),
            '<proposal description>',
          ],
          voters: [
            { address: voter, support: new BN('100') },
          ],
          steps: {
            queue: { enable: true, delay: 3600 },
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
          'DelayChange',
          { oldDuration: '3600', newDuration: '7200' },
        );
        expect(await this.governor.delay()).to.be.bignumber.equal('7200');
      });
      runGovernorWorkflow();
    });
  });
});
