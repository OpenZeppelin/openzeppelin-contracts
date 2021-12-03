const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const Enums = require('../../helpers/enums');

const {
  runGovernorWorkflow,
} = require('../GovernorWorkflow.behavior');

const Token = artifacts.require('ERC20VotesCompMock');
const Governor = artifacts.require('GovernorPreventLateQuorumMock');
const CallReceiver = artifacts.require('CallReceiverMock');

contract('GovernorPreventLateQuorum', function (accounts) {
  const [ owner, proposer, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governor';
  // const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = new BN(4);
  const votingPeriod = new BN(16);
  const lateQuorumVoteExtension = new BN(8);
  const quorum = web3.utils.toWei('1');

  beforeEach(async function () {
    this.owner = owner;
    this.token = await Token.new(tokenName, tokenSymbol);
    this.mock = await Governor.new(
      name,
      this.token.address,
      votingDelay,
      votingPeriod,
      quorum,
      lateQuorumVoteExtension,
    );
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });
  });

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
    expect(await this.mock.quorum(0)).to.be.bignumber.equal(quorum);
    expect(await this.mock.lateQuorumVoteExtension()).to.be.bignumber.equal(lateQuorumVoteExtension);
  });

  describe('nominal is unaffected', function () {
    beforeEach(async function () {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ 0 ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          '<proposal description>',
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('1'), support: Enums.VoteType.For, reason: 'This is nice' },
          { voter: voter2, weight: web3.utils.toWei('7'), support: Enums.VoteType.For },
          { voter: voter3, weight: web3.utils.toWei('5'), support: Enums.VoteType.Against },
          { voter: voter4, weight: web3.utils.toWei('2'), support: Enums.VoteType.Abstain },
        ],
      };
    });

    afterEach(async function () {
      expect(await this.mock.hasVoted(this.id, owner)).to.be.equal(false);
      expect(await this.mock.hasVoted(this.id, voter1)).to.be.equal(true);
      expect(await this.mock.hasVoted(this.id, voter2)).to.be.equal(true);

      await this.mock.proposalVotes(this.id).then(result => {
        for (const [key, value] of Object.entries(Enums.VoteType)) {
          expect(result[`${key.toLowerCase()}Votes`]).to.be.bignumber.equal(
            Object.values(this.settings.voters).filter(({ support }) => support === value).reduce(
              (acc, { weight }) => acc.add(new BN(weight)),
              new BN('0'),
            ),
          );
        }
      });

      const startBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay);
      const endBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay).add(votingPeriod);
      expect(await this.mock.proposalSnapshot(this.id)).to.be.bignumber.equal(startBlock);
      expect(await this.mock.proposalDeadline(this.id)).to.be.bignumber.equal(endBlock);

      expectEvent(
        this.receipts.propose,
        'ProposalCreated',
        {
          proposalId: this.id,
          proposer,
          targets: this.settings.proposal[0],
          // values: this.settings.proposal[1].map(value => new BN(value)),
          signatures: this.settings.proposal[2].map(() => ''),
          calldatas: this.settings.proposal[2],
          startBlock,
          endBlock,
          description: this.settings.proposal[3],
        },
      );

      this.receipts.castVote.filter(Boolean).forEach(vote => {
        const { voter } = vote.logs.find(Boolean).args;
        expectEvent(
          vote,
          'VoteCast',
          this.settings.voters.find(({ address }) => address === voter),
        );
        expectEvent.notEmitted(
          vote,
          'ProposalExtended',
        );
      });
      expectEvent(
        this.receipts.execute,
        'ProposalExecuted',
        { proposalId: this.id },
      );
      await expectEvent.inTransaction(
        this.receipts.execute.transactionHash,
        this.receiver,
        'MockFunctionCalled',
      );
    });
    runGovernorWorkflow();
  });

  describe('Delay is extended to prevent last minute take-over', function () {
    beforeEach(async function () {
      this.settings = {
        proposal: [
          [ this.receiver.address ],
          [ 0 ],
          [ this.receiver.contract.methods.mockFunction().encodeABI() ],
          '<proposal description>',
        ],
        proposer,
        tokenHolder: owner,
        voters: [
          { voter: voter1, weight: web3.utils.toWei('0.2'), support: Enums.VoteType.Against },
          { voter: voter2, weight: web3.utils.toWei('1.0') }, // do not actually vote, only getting tokens
          { voter: voter3, weight: web3.utils.toWei('0.9') }, // do not actually vote, only getting tokens
        ],
        steps: {
          wait: { enable: false },
          execute: { enable: false },
        },
      };
    });

    afterEach(async function () {
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);

      const startBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay);
      const endBlock = new BN(this.receipts.propose.blockNumber).add(votingDelay).add(votingPeriod);
      expect(await this.mock.proposalSnapshot(this.id)).to.be.bignumber.equal(startBlock);
      expect(await this.mock.proposalDeadline(this.id)).to.be.bignumber.equal(endBlock);

      // wait until the vote is almost over
      await time.advanceBlockTo(endBlock.subn(1));
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);

      // try to overtake the vote at the last minute
      const tx = await this.mock.castVote(this.id, Enums.VoteType.For, { from: voter2 });

      // vote duration is extended
      const extendedBlock = new BN(tx.receipt.blockNumber).add(lateQuorumVoteExtension);
      expect(await this.mock.proposalDeadline(this.id)).to.be.bignumber.equal(extendedBlock);

      expectEvent(
        tx,
        'ProposalExtended',
        { proposalId: this.id, extendedDeadline: extendedBlock },
      );

      // vote is still active after expected end
      await time.advanceBlockTo(endBlock.addn(1));
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Active);

      // Still possible to vote
      await this.mock.castVote(this.id, Enums.VoteType.Against, { from: voter3 });

      // proposal fails
      await time.advanceBlockTo(extendedBlock.addn(1));
      expect(await this.mock.state(this.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
    });
    runGovernorWorkflow();
  });

  describe('setLateQuorumVoteExtension', function () {
    beforeEach(async function () {
      this.newVoteExtension = new BN(0); // disable voting delay extension
    });

    it('protected', async function () {
      await expectRevert(
        this.mock.setLateQuorumVoteExtension(this.newVoteExtension),
        'Governor: onlyGovernance',
      );
    });

    describe('using workflow', function () {
      beforeEach(async function () {
        this.settings = {
          proposal: [
            [ this.mock.address ],
            [ web3.utils.toWei('0') ],
            [ this.mock.contract.methods.setLateQuorumVoteExtension(this.newVoteExtension).encodeABI() ],
            '<proposal description>',
          ],
          proposer,
          tokenHolder: owner,
          voters: [
            { voter: voter1, weight: web3.utils.toWei('1.0'), support: Enums.VoteType.For },
          ],
        };
      });
      afterEach(async function () {
        expectEvent(
          this.receipts.propose,
          'ProposalCreated',
          { proposalId: this.id },
        );
        expectEvent(
          this.receipts.execute,
          'ProposalExecuted',
          { proposalId: this.id },
        );
        expectEvent(
          this.receipts.execute,
          'LateQuorumVoteExtensionSet',
          { oldVoteExtension: lateQuorumVoteExtension, newVoteExtension: this.newVoteExtension },
        );
        expect(await this.mock.lateQuorumVoteExtension()).to.be.bignumber.equal(this.newVoteExtension);
      });
      runGovernorWorkflow();
    });
  });
});
