const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token        = artifacts.require('ERC20VotesMock');
const Timelock     = artifacts.require('TimelockController');
const Governance   = artifacts.require('GovernorWithTimelockExternalMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('Governance', function (accounts) {
  const [ voter ] = accounts;

  const name        = 'OZ-Governance';
  const version     = '0.0.1';
  const tokenName   = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.token      = await Token.new(tokenName, tokenSymbol, voter, tokenSupply);
    this.timelock   = await Timelock.new(3600, [], []);
    this.governance = await Governance.new(name, version, this.token.address, this.timelock.address);
    this.receiver   = await CallReceiver.new();
    await this.timelock.grantRole(await this.timelock.PROPOSER_ROLE(), this.governance.address);
    await this.timelock.grantRole(await this.timelock.EXECUTOR_ROLE(), this.governance.address);
    await this.token.delegate(voter, { from: voter });
  });

  it('governance', async () => {
    expect(await this.governance.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governance.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governance.quorum()).to.be.bignumber.equal('1');
    expect(await this.governance.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governance.requiredScore()).to.be.bignumber.equal('50');
  });

  describe('workflow', () => {
    describe('with proposal', () => {
      beforeEach(async () => {
        this.proposal = [
          [ this.receiver.address ],
          [ new BN('0') ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          web3.utils.randomHex(32),
        ];
        this.id = await this.governance.hashProposal(...proposal);
        this.timelockid = await this.timelock.hashOperationBatch(this.proposal[0], this.proposal[1], this.proposal[2], '0x0', this.proposal[3]);
        this.voteSupport = new BN(100);
        this.receipts = {};
      });

      describe('with proposed', () => {
        beforeEach(async () => {
          ({ receipt: this.receipts.propose } = await this.governance.propose(...this.proposal));
          expectEvent(this.receipts.propose, 'TimerStarted');
          expectEvent(this.receipts.propose, 'ProposalCreated');
        });

        describe('with vote', () => {
          beforeEach(async () => {
            ({ receipt: this.receipts.castVote } = await this.governance.castVote(this.id, this.voteSupport, { from: voter}));
            expectEvent(this.receipts.castVote, 'VoteCast');
          });

          describe('after deadline', () => {
            beforeEach(async () => {
              ({ deadline: this.deadline } = await this.governance.viewProposal(this.id));
              await time.increaseTo(this.deadline.addn(1));
            });

            describe('with queue', () => {
              beforeEach(async () => {
                ({ receipt: this.receipts.queue } = await this.governance.queue(...this.proposal));
                expectEvent(this.receipts.queue, 'TimerReset');
                expectEvent(this.receipts.queue, 'TimerLocked');
                expectEvent(this.receipts.queue, 'TimerStarted');
                expectEvent(this.receipts.queue, 'ProposalQueued');
              });

              describe('after timelock', () => {
                beforeEach(async () => {
                  this.timelockDeadline = await this.timelock.getTimestamp(this.timelockid);
                  await time.increaseTo(this.timelockDeadline.addn(1));
                });

                describe('with execute', () => {
                  beforeEach(async () => {
                    ({ receipt: this.receipts.execute } = await this.governance.execute(...this.proposal));
                    expectEvent(this.receipts.execute, 'TimerReset');
                    expectEvent(this.receipts.execute, 'TimerLocked');
                    expectEvent(this.receipts.execute, 'ProposalExecuted');
                  });

                  it('post check', async () => {
                    expectEvent(this.receipts.propose, 'TimerStarted', {
                      timer:    web3.utils.toHex(this.id),
                      deadline: this.deadline,
                    });
                    expectEvent(this.receipts.propose, 'ProposalCreated', {
                      proposalId: this.id,
                      targets:    this.proposal[0],
                      // values:     this.proposal[1],
                      calldatas:  this.proposal[2],
                      salt:       this.proposal[3],
                    });
                    expectEvent(this.receipts.castVote, 'VoteCast', {
                      proposalId: this.id,
                      voter:      voter,
                      support:    this.voteSupport,
                      votes:      tokenSupply,
                    });
                    expectEvent(this.receipts.queue, 'TimerReset', {
                      timer:    web3.utils.toHex(this.id),
                    });
                    expectEvent(this.receipts.queue, 'TimerLocked', {
                      timer:    web3.utils.toHex(this.id),
                    });
                    expectEvent(this.receipts.queue, 'TimerStarted', {
                      timer:    this.timelockid,
                    });
                    expectEvent(this.receipts.queue, 'ProposalQueued', {
                      proposalId: this.id,
                    });
                    expectEvent(this.receipts.execute, 'TimerReset', {
                      timer:    this.timelockid,
                    });
                    expectEvent(this.receipts.execute, 'TimerLocked', {
                      timer:    this.timelockid,
                    });
                    expectEvent(this.receipts.execute, 'ProposalExecuted', {
                      proposalId: this.id,
                    });
                    expectEvent.inTransaction(this.receipts.execute.transactionHash,
                      this.receiver,
                      'MockFunctionCalled',
                    );
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
