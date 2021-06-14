const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const Enums = require('../../helpers/enums');
const RLP = require('rlp');

// const {
//   runGovernorWorkflow,
// } = require('./GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesCompMock');
const Timelock = artifacts.require('CompTimelock');
const Governance = artifacts.require('GovernorCompoundMock');
const CallReceiver = artifacts.require('CallReceiverMock');

async function getReceiptOrReason (promise, reason = undefined) {
  if (reason) {
    await expectRevert(promise, reason);
    return undefined;
  } else {
    const { receipt } = await promise;
    return receipt;
  }
}

function tryGet (obj, path = '') {
  try {
    return path.split('.').reduce((o, k) => o[k], obj);
  } catch (_) {
    return undefined;
  }
}

function makeContractAddress (creator, nonce) {
  return web3.utils.toChecksumAddress(web3.utils.sha3(RLP.encode([creator, nonce])).slice(12).substring(14));
}

contract('Governance', function (accounts) {
  const [ owner, proposer, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governance';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');

  beforeEach(async () => {
    const [ deployer ] = await web3.eth.getAccounts();

    this.token = await Token.new(tokenName, tokenSymbol);

    // Need to predict governance address to set it as timelock admin with a delayed transfer
    const nonce = await web3.eth.getTransactionCount(deployer);
    const predictGovernance = makeContractAddress(deployer, nonce + 1);

    this.timelock = await Timelock.new(predictGovernance, 2 * 86400);
    this.governor = await Governance.new(name, this.token.address, this.timelock.address);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });
  });

  it('deployment check', async () => {
    expect(await this.governor.name()).to.be.equal(name);
    expect(await this.governor.token()).to.be.equal(this.token.address);
    expect(await this.governor.votingDelay()).to.be.bignumber.equal('0');
    expect(await this.governor.votingPeriod()).to.be.bignumber.equal('16');
    expect(await this.governor.quorum(0)).to.be.bignumber.equal('1');
  });

  describe('nominal', () => {
    beforeEach(async () => {
      this.settings = {
        proposal: [
          [ this.receiver.address ], // targets
          [ web3.utils.toWei('0') ], // values
          [ '' ], // signatures
          [ this.receiver.contract.methods.mockFunction().encodeABI() ], // calldatas
          '<proposal description>', // description
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For },
          { voter: voter2, weight: web3.utils.toWei('10'), support: Enums.VoteType.For },
          { voter: voter3, weight: web3.utils.toWei('5'), support: Enums.VoteType.Against },
          { voter: voter4, weight: web3.utils.toWei('2'), support: Enums.VoteType.Abstain },
        ],
        steps: {
          queue: { delay: 7 * 86400 },
        },
      };
      this.votingDelay = await this.governor.votingDelay();
      this.votingPeriod = await this.governor.votingPeriod();
      this.receipts = {};
    });

    afterEach(async () => {
      const proposal = await this.governor.proposals(this.id);
      expect(proposal.id).to.be.bignumber.equal(this.id);
      expect(proposal.proposer).to.be.equal(proposer);
      expect(proposal.eta).to.be.bignumber.equal(this.eta);
      expect(proposal.targets).to.be.deep.equal(this.settings.proposal[0]);
      // expect(proposal.values).to.be.deep.equal(this.settings.proposal[1]);
      expect(proposal.signatures).to.be.deep.equal(this.settings.proposal[2]);
      expect(proposal.calldatas).to.be.deep.equal(this.settings.proposal[3]);
      expect(proposal.startBlock).to.be.bignumber.equal(this.snapshot);
      expect(proposal.endBlock).to.be.bignumber.equal(this.deadline);
      // expect(proposal.forVotes).to.be.bignumber.equal('11000000000000000000');
      // expect(proposal.againstVotes).to.be.bignumber.equal('5000000000000000000');
      // expect(proposal.abstainVotes).to.be.bignumber.equal('2000000000000000000');
      expect(proposal.canceled).to.be.equal(false);
      expect(proposal.executed).to.be.equal(false); // this is broken :/

      for (const [key, value] of Object.entries(Enums.VoteType)) {
        expect(proposal[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
          Object.values(this.settings.voters).filter(({ support }) => support === value).reduce(
            (acc, { weight }) => acc.add(new BN(weight)),
            new BN('0'),
          ),
        );
      }

      const action = await this.governor.getActions(this.id);
      expect(action.targets).to.be.deep.equal(this.settings.proposal[0]);
      // expect(action.values).to.be.deep.equal(this.settings.proposal[1]);
      expect(action.signatures).to.be.deep.equal(this.settings.proposal[2]);
      expect(action.calldatas).to.be.deep.equal(this.settings.proposal[3]);

      for (const voter of this.settings.voters) {
        const receipt = await this.governor.getReceipt(this.id, voter.voter);
        expect(receipt.hasVoted).to.be.equal(true);
        expect(receipt.support).to.be.bignumber.equal(voter.support);
        expect(receipt.votes).to.be.bignumber.equal(voter.weight);
      }

      expectEvent(
        this.receipts.propose,
        'ProposalCreated',
        {
          proposalId: this.id,
          proposer,
          targets: this.settings.proposal[0],
          // values: this.settings.proposal[1].map(value => new BN(value)),
          signatures: this.settings.proposal[2],
          calldatas: this.settings.proposal[3],
          startBlock: new BN(this.receipts.propose.blockNumber).add(this.votingDelay),
          endBlock: new BN(this.receipts.propose.blockNumber).add(this.votingDelay).add(this.votingPeriod),
          description: this.settings.proposal[4],
        },
      );

      expectEvent(
        this.receipts.propose,
        'ProposalSalt',
        {
          proposalId: this.id,
        },
      );

      this.receipts.castVote.forEach(vote => {
        const { voter } = vote.logs.find(Boolean).args;
        expectEvent(
          vote,
          'VoteCast',
          this.settings.voters.find(({ address }) => address === voter),
        );
      });
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

    it('run', async () => {
      // transfer tokens
      if (tryGet(this.settings, 'voters')) {
        for (const voter of this.settings.voters) {
          if (voter.weight) {
            await this.token.transfer(voter.voter, voter.weight, { from: this.settings.tokenHolder });
          }
        }
      }

      // propose
      if (this.governor.propose && tryGet(this.settings, 'steps.propose.enable') !== false) {
        this.receipts.propose = await getReceiptOrReason(
          this.governor.methods['propose(address[],uint256[],string[],bytes[],string)'](...this.settings.proposal, { from: this.settings.proposer }),
          tryGet(this.settings, 'steps.propose.reason'),
        );

        if (tryGet(this.settings, 'steps.propose.reason') === undefined) {
          this.id = this.receipts.propose.logs.find(({ event }) => event === 'ProposalCreated').args.proposalId;
          this.snapshot = await this.governor.proposalSnapshot(this.id);
          this.deadline = await this.governor.proposalDeadline(this.id);
        }

        if (tryGet(this.settings, 'steps.propose.delay')) {
          await time.increase(tryGet(this.settings, 'steps.propose.delay'));
        }
      }

      // vote
      if (tryGet(this.settings, 'voters')) {
        this.receipts.castVote = [];
        for (const voter of this.settings.voters) {
          if (!voter.signature) {
            this.receipts.castVote.push(
              await getReceiptOrReason(
                this.governor.castVote(this.id, voter.support, { from: voter.voter }),
                voter.reason,
              ),
            );
          } else {
            const { v, r, s } = await voter.signature({ proposalId: this.id, support: voter.support });
            this.receipts.castVote.push(
              await getReceiptOrReason(
                this.governor.castVoteBySig(this.id, voter.support, v, r, s),
                voter.reason,
              ),
            );
          }
          if (tryGet(voter, 'delay')) {
            await time.increase(tryGet(voter, 'delay'));
          }
        }
      }

      // fast forward
      if (tryGet(this.settings, 'steps.wait.enable') !== false) {
        await time.advanceBlockTo(this.deadline);
      }

      // queue
      if (this.governor.queue && tryGet(this.settings, 'steps.queue.enable') !== false) {
        this.receipts.queue = await getReceiptOrReason(
          this.governor.methods['queue(uint256)'](this.id, { from: this.settings.queuer }),
          tryGet(this.settings, 'steps.queue.reason'),
        );
        this.eta = await this.governor.proposalEta(this.id);
        if (tryGet(this.settings, 'steps.queue.delay')) {
          await time.increase(tryGet(this.settings, 'steps.queue.delay'));
        }
      }

      // execute
      if (this.governor.execute && tryGet(this.settings, 'steps.execute.enable') !== false) {
        this.receipts.execute = await getReceiptOrReason(
          this.governor.methods['execute(uint256)'](this.id, { from: this.settings.executer }),
          tryGet(this.settings, 'steps.execute.reason'),
        );
        if (tryGet(this.settings, 'steps.execute.delay')) {
          await time.increase(tryGet(this.settings, 'steps.execute.delay'));
        }
      }
    });
  });
});
