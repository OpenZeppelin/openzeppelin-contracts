const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token        = artifacts.require('ERC20VotesMock');
const Governance   = artifacts.require('GovernanceMock');
const CallReceiver = artifacts.require('CallReceiverMock');

async function getReceiptOrReason(promise, reason = undefined) {
  if (reason) {
    await expectRevert(promise, reason);
    return undefined;
  } else {
    const { receipt } = await promise;
    return receipt;
  }
}

function governanceWorkflow() {
  describe('with deposits', () => {
    beforeEach(async () => {
      this.receipts = {};
      this.id = await this.governance.hashProposal(...this.settings.proposal);
      for (const voter of this.settings.voters) {
        await this.token.transfer(voter.address, voter.weight, { from: this.owner });
      }
    });

    describe('with proposed', () => {
      beforeEach(async () => {
        if (this.settings.steps.propose.enable) {
          this.receipts.propose = await getReceiptOrReason(this.governance.propose(...this.settings.proposal), this.settings.steps.propose.reason);
        }
      });

      describe('with vote', () => {
        beforeEach(async () => {
          this.receipts.castVote = [];
          for (const voter of this.settings.voters) {
            this.receipts.castVote.push(
              await getReceiptOrReason(this.governance.castVote(this.id, voter.support, { from: voter.address }), voter.reason)
            )
          }
        });

        describe('after deadline', () => {
          beforeEach(async () => {
            ({ deadline: this.deadline } = await this.governance.viewProposal(this.id));
            if (this.settings.steps.wait.enable) {
              await time.increaseTo(this.deadline.addn(1));
            }
          });

          describe('with execute', () => {
            beforeEach(async () => {
              if (this.settings.steps.execute.enable) {
                this.receipts.execute = await getReceiptOrReason(this.governance.execute(...this.settings.proposal), this.settings.steps.execute.reason);
              }
            });

            it('check', async () => {
              await this.settings.check();
            });
          });
        });
      });
    });
  });
}

contract('Governance', function (accounts) {
  const [ owner, voter, other ] = accounts;
  const name        = 'BosonGovernance'
  const version     = '0.0.1';
  const tokenName   = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.owner      = owner;
    this.token      = await Token.new(tokenName, tokenSymbol, owner, tokenSupply);
    this.governance = await Governance.new(name, version, this.token.address);
    this.receiver   = await CallReceiver.new();
    await this.token.delegate(voter, { from: voter });
    await this.token.delegate(other, { from: other });
  });

  describe('good', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('100') },
          { address: other, weight: web3.utils.toWei('1'), support: new BN('40')  },
        ],
        steps: {
          propose: { enable: true },
          wait:    { enable: true },
          execute: { enable: true },
        },
        check: async () => {
          expectEvent(this.receipts.propose, 'TimerStarted', { timer: web3.utils.toHex(this.id), deadline: this.deadline });
          expectEvent(this.receipts.execute, 'TimerReset', { timer: web3.utils.toHex(this.id) });
          expectEvent(this.receipts.execute, 'TimerLocked', { timer: web3.utils.toHex(this.id) });
          expectEvent.inTransaction(this.receipts.execute.transactionHash,
            this.receiver,
            'MockFunctionCalled',
          );

          await expectRevert(this.governance.castVote(this.id, new BN('0'), { from: accounts[2] }), "Governance: vote not currently active");
        }
      }
    });
    governanceWorkflow();
  });

  describe('missing proposal', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('100'), reason: 'Governance: vote not currently active' },
          { address: other, weight: web3.utils.toWei('1'), support: new BN('40'),  reason: 'Governance: vote not currently active' },
        ],
        steps: {
          propose: { enable: false },
          wait:    { enable: false },
          execute: { enable: true, reason: 'Governance: proposal not ready to execute' },
        },
        check: () => {}
      }
    });
    governanceWorkflow();
  });

  describe('double cast', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('100') },
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('100'), reason: 'Governance: vote already casted' },
        ],
        steps: {
          propose: { enable: true },
          wait:    { enable: true },
          execute: { enable: true },
        },
        check: () => {}
      }
    });
    governanceWorkflow();
  });

  describe('quorum not reached', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('0'), support: new BN('100') },
          { address: other, weight: web3.utils.toWei('0'), support: new BN('40') },
        ],
        steps: {
          propose: { enable: true },
          wait:    { enable: true },
          execute: { enable: true, reason: 'Governance: quorum not reached' },
        },
        check: () => {}
      }
    });
    governanceWorkflow();
  });

  describe('score not reached', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('0') },
          { address: other, weight: web3.utils.toWei('1'), support: new BN('0') },
        ],
        steps: {
          propose: { enable: true },
          wait:    { enable: true },
          execute: { enable: true, reason: 'Governance: required score not reached' },
        },
        check: () => {}
      }
    });
    governanceWorkflow();
  });

  describe('vote not over', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ],
        voters: [
          { address: voter, weight: web3.utils.toWei('1'), support: new BN('100') },
        ],
        steps: {
          propose: { enable: true },
          wait:    { enable: false },
          execute: { enable: true, reason: 'Governance: proposal not ready to execute' },
        },
        check: () => {}
      }
    });
    governanceWorkflow();
  });
});
