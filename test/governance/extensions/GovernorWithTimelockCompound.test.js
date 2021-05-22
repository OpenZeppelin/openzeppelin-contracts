const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const RLP = require('rlp');

const Token = artifacts.require('ERC20VotesMock');
const Timelock = artifacts.require('CompTimelock');
const Governance = artifacts.require('GovernorWithTimelockCompoundMock');
const CallReceiver = artifacts.require('CallReceiverMock');

function makeContractAddress (creator, nonce) {
  return web3.utils.toChecksumAddress(web3.utils.sha3(RLP.encode([creator, nonce])).slice(12).substring(14));
}

contract('Governance', function (accounts) {
  const [ voter ] = accounts;

  const name = 'OZ-Governance';
  const version = '0.0.1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    this.token = await Token.new(tokenName, tokenSymbol, voter, tokenSupply);

    // Need to predict governance address to set it as timelock admin with a delayed transfer
    const [ deployer ] = await web3.eth.getAccounts();
    const nonce = await web3.eth.getTransactionCount(deployer);
    const predictGovernance = makeContractAddress(deployer, nonce + 1);

    this.timelock = await Timelock.new(predictGovernance, 2 * 86400);
    this.governor = await Governance.new(name, version, this.token.address, this.timelock.address);
    this.receiver = await CallReceiver.new();
    await this.token.delegate(voter, { from: voter });
  });

  it('post deployment check', async () => {
    expect(await this.governor.token()).to.be.bignumber.equal(this.token.address);
    expect(await this.governor.votingDuration()).to.be.bignumber.equal('604800');
    expect(await this.governor.maxScore()).to.be.bignumber.equal('100');
    expect(await this.governor.requiredScore()).to.be.bignumber.equal('50');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');

    expect(await this.governor.timelock()).to.be.equal(this.timelock.address);
    expect(await this.timelock.admin()).to.be.equal(this.governor.address);
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
        this.id = await this.governor.hashProposal(...this.proposal);
        this.voteSupport = new BN(100);
        this.receipts = {};
      });

      describe('with proposed', () => {
        beforeEach(async () => {
          ({ receipt: this.receipts.propose } = await this.governor.propose(
            ...this.proposal,
            '<proposal description>',
          ));
          expectEvent(this.receipts.propose, 'ProposalCreated');
        });

        describe('with vote', () => {
          beforeEach(async () => {
            ({ receipt: this.receipts.castVote } = await this.governor.castVote(
              this.id,
              this.voteSupport,
              { from: voter },
            ));
            expectEvent(this.receipts.castVote, 'VoteCast');
          });

          describe('after deadline', () => {
            beforeEach(async () => {
              ({ deadline: this.deadline } = await this.governor.viewProposal(this.id));
              await time.increaseTo(this.deadline.addn(1));
            });

            describe('with queue', () => {
              beforeEach(async () => {
                ({ receipt: this.receipts.queue } = await this.governor.queue(...this.proposal));
                expectEvent(this.receipts.queue, 'ProposalQueued');
              });

              describe('after timelock', () => {
                beforeEach(async () => {
                  this.eta = await this.governor.proposalEta(this.id);
                  await time.increaseTo(this.eta.addn(1));
                  await time.increase(2 * 86400);
                });

                describe('with execute', () => {
                  beforeEach(async () => {
                    ({ receipt: this.receipts.execute } = await this.governor.execute(...this.proposal));
                    expectEvent(this.receipts.execute, 'ProposalExecuted');
                  });

                  it('post check', async () => {
                    expectEvent(this.receipts.propose, 'ProposalCreated', {
                      proposalId: this.id,
                      targets: this.proposal[0],
                      // values: this.proposal[1],
                      calldatas: this.proposal[2],
                      salt: this.proposal[3],
                      votingDeadline: this.deadline,
                    });
                    expectEvent(this.receipts.castVote, 'VoteCast', {
                      proposalId: this.id,
                      voter: voter,
                      support: this.voteSupport,
                      votes: tokenSupply,
                    });
                    expectEvent(this.receipts.queue, 'ProposalQueued', {
                      proposalId: this.id,
                    });
                    expectEvent(this.receipts.execute, 'ProposalExecuted', {
                      proposalId: this.id,
                    });
                    expectEvent.inTransaction(
                      this.receipts.execute.transactionHash,
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

  describe('updateTimelock', () => {
    beforeEach(async () => {
      this.newTimelock = await Timelock.new(this.governor.address, 7 * 86400);
    });

    it('protected', async () => {
      await expectRevert(
        this.governor.updateTimelock(this.newTimelock.address),
        'GovernorWithTimelockCompound: caller must be timelock',
      );
    });

    it('update by proposal', async () => {
      const proposal = [
        [ this.governor.address ],
        [ new BN('0') ],
        [ this.governor.contract.methods.updateTimelock(this.newTimelock.address).encodeABI() ],
        web3.utils.randomHex(32),
        '<proposal description>',
      ];
      const proposalId = await this.governor.hashProposal(...proposal.slice(0, -1));

      await this.governor.propose(...proposal);
      await this.governor.castVote(proposalId, new BN('100'), { from: voter });
      const { deadline } = await this.governor.viewProposal(proposalId);
      await time.increaseTo(deadline.addn(1));
      const { receipt: receiptQueue } = await this.governor.queue(...proposal.slice(0, -1));
      const { eta } = receiptQueue.logs.find(({ event }) => event === 'ProposalQueued').args;
      await time.increaseTo(eta);
      const { receipt: receiptExecute } = await this.governor.execute(...proposal.slice(0, -1));

      await expectEvent(
        receiptExecute,
        'TimelockChange',
        { oldTimelock: this.timelock.address, newTimelock: this.newTimelock.address },
      );
      expect(await this.governor.timelock()).to.be.bignumber.equal(this.newTimelock.address);
    });
  });
});
