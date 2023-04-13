const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const RLP = require('rlp');
const Enums = require('../../helpers/enums');
const { GovernorHelper } = require('../../helpers/governance');

const Token = artifacts.require('ERC20VotesCompMock');
const Timelock = artifacts.require('CompTimelock');
const Governor = artifacts.require('GovernorCompatibilityBravoMock');
const CallReceiver = artifacts.require('CallReceiverMock');

function makeContractAddress (creator, nonce) {
  return web3.utils.toChecksumAddress(web3.utils.sha3(RLP.encode([creator, nonce])).slice(12).substring(14));
}

contract('GovernorCompatibilityBravo', function (accounts) {
  const [ owner, proposer, voter1, voter2, voter3, voter4, other ] = accounts;

  const name = 'OZ-Governor';
  // const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = new BN(4);
  const votingPeriod = new BN(16);
  const proposalThreshold = web3.utils.toWei('10');
  const value = web3.utils.toWei('1');

  beforeEach(async function () {
    const [ deployer ] = await web3.eth.getAccounts();

    this.token = await Token.new(tokenName, tokenSymbol);

    // Need to predict governance address to set it as timelock admin with a delayed transfer
    const nonce = await web3.eth.getTransactionCount(deployer);
    const predictGovernor = makeContractAddress(deployer, nonce + 1);

    this.timelock = await Timelock.new(predictGovernor, 2 * 86400);
    this.mock = await Governor.new(
      name,
      this.token.address,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      this.timelock.address,
    );
    this.receiver = await CallReceiver.new();

    this.helper = new GovernorHelper(this.mock);

    await web3.eth.sendTransaction({ from: owner, to: this.timelock.address, value });

    await this.token.mint(owner, tokenSupply);
    await this.helper.delegate({ token: this.token, to: proposer, value: proposalThreshold }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter1, value: web3.utils.toWei('10') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter2, value: web3.utils.toWei('7') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter3, value: web3.utils.toWei('5') }, { from: owner });
    await this.helper.delegate({ token: this.token, to: voter4, value: web3.utils.toWei('2') }, { from: owner });

    // default proposal
    this.proposal = this.helper.setProposal([
      {
        target: this.receiver.address,
        value,
        signature: 'mockFunction()',
      },
    ], '<proposal description>');
  });

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
    expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');
    expect(await this.mock.quorumVotes()).to.be.bignumber.equal('0');
    expect(await this.mock.COUNTING_MODE()).to.be.equal('support=bravo&quorum=bravo');
  });

  it('nominal workflow', async function () {
    // Before
    expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(false);
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal(value);
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

    // Run proposal
    const txPropose = await this.helper.propose({ from: proposer });
    await this.helper.waitForSnapshot();
    await this.helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 });
    await this.helper.vote({ support: Enums.VoteType.For }, { from: voter2 });
    await this.helper.vote({ support: Enums.VoteType.Against }, { from: voter3 });
    await this.helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 });
    await this.helper.waitForDeadline();
    await this.helper.queue();
    await this.helper.waitForEta();
    const txExecute = await this.helper.execute();

    // After
    expect(await this.mock.hasVoted(this.proposal.id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(this.proposal.id, voter1)).to.be.equal(true);
    expect(await this.mock.hasVoted(this.proposal.id, voter2)).to.be.equal(true);
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.timelock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);

    const proposal = await this.mock.proposals(this.proposal.id);
    expect(proposal.id).to.be.bignumber.equal(this.proposal.id);
    expect(proposal.proposer).to.be.equal(proposer);
    expect(proposal.eta).to.be.bignumber.equal(await this.mock.proposalEta(this.proposal.id));
    expect(proposal.startBlock).to.be.bignumber.equal(await this.mock.proposalSnapshot(this.proposal.id));
    expect(proposal.endBlock).to.be.bignumber.equal(await this.mock.proposalDeadline(this.proposal.id));
    expect(proposal.canceled).to.be.equal(false);
    expect(proposal.executed).to.be.equal(true);

    const action = await this.mock.getActions(this.proposal.id);
    expect(action.targets).to.be.deep.equal(this.proposal.targets);
    // expect(action.values).to.be.deep.equal(this.proposal.values);
    expect(action.signatures).to.be.deep.equal(this.proposal.signatures);
    expect(action.calldatas).to.be.deep.equal(this.proposal.data);

    const voteReceipt1 = await this.mock.getReceipt(this.proposal.id, voter1);
    expect(voteReceipt1.hasVoted).to.be.equal(true);
    expect(voteReceipt1.support).to.be.bignumber.equal(Enums.VoteType.For);
    expect(voteReceipt1.votes).to.be.bignumber.equal(web3.utils.toWei('10'));

    const voteReceipt2 = await this.mock.getReceipt(this.proposal.id, voter2);
    expect(voteReceipt2.hasVoted).to.be.equal(true);
    expect(voteReceipt2.support).to.be.bignumber.equal(Enums.VoteType.For);
    expect(voteReceipt2.votes).to.be.bignumber.equal(web3.utils.toWei('7'));

    const voteReceipt3 = await this.mock.getReceipt(this.proposal.id, voter3);
    expect(voteReceipt3.hasVoted).to.be.equal(true);
    expect(voteReceipt3.support).to.be.bignumber.equal(Enums.VoteType.Against);
    expect(voteReceipt3.votes).to.be.bignumber.equal(web3.utils.toWei('5'));

    const voteReceipt4 = await this.mock.getReceipt(this.proposal.id, voter4);
    expect(voteReceipt4.hasVoted).to.be.equal(true);
    expect(voteReceipt4.support).to.be.bignumber.equal(Enums.VoteType.Abstain);
    expect(voteReceipt4.votes).to.be.bignumber.equal(web3.utils.toWei('2'));

    expectEvent(
      txPropose,
      'ProposalCreated',
      {
        proposalId: this.proposal.id,
        proposer,
        targets: this.proposal.targets,
        // values: this.proposal.values,
        signatures: this.proposal.signatures.map(() => ''), // this event doesn't contain the proposal detail
        calldatas: this.proposal.fulldata,
        startBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay),
        endBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay).add(votingPeriod),
        description: this.proposal.description,
      },
    );
    expectEvent(
      txExecute,
      'ProposalExecuted',
      { proposalId: this.proposal.id },
    );
    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalled',
    );
  });

  it('double voting is forbiden', async function () {
    await this.helper.propose({ from: proposer });
    await this.helper.waitForSnapshot();
    await this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await expectRevert(
      this.helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
      'GovernorCompatibilityBravo: vote already cast',
    );
  });

  it('with function selector and arguments', async function () {
    const target = this.receiver.address;
    this.helper.setProposal([
      { target, data: this.receiver.contract.methods.mockFunction().encodeABI() },
      { target, data: this.receiver.contract.methods.mockFunctionWithArgs(17, 42).encodeABI() },
      { target, signature: 'mockFunctionNonPayable()' },
      {
        target,
        signature: 'mockFunctionWithArgs(uint256,uint256)',
        data: web3.eth.abi.encodeParameters(['uint256', 'uint256'], [18, 43]),
      },
    ], '<proposal description>');

    await this.helper.propose({ from: proposer });
    await this.helper.waitForSnapshot();
    await this.helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 });
    await this.helper.waitForDeadline();
    await this.helper.queue();
    await this.helper.waitForEta();
    const txExecute = await this.helper.execute();

    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalled',
    );
    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalled',
    );
    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalledWithArgs',
      { a: '17', b: '42' },
    );
    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalledWithArgs',
      { a: '18', b: '43' },
    );
  });

  it('with inconsistent array size for selector and arguments', async function () {
    const target = this.receiver.address;
    this.helper.setProposal(
      {
        targets: [target, target],
        values: [0, 0],
        signatures: ['mockFunction()'], // One signature
        data: ['0x', this.receiver.contract.methods.mockFunctionWithArgs(17, 42).encodeABI()], // Two data entries
      },
      '<proposal description>',
    );

    await expectRevert(this.helper.propose({ from: proposer }), 'GovernorBravo: invalid signatures length');
  });

  describe('should revert', function () {
    describe('on propose', function () {
      it('if proposal does not meet proposalThreshold', async function () {
        await expectRevert(
          this.helper.propose({ from: other }),
          'Governor: proposer votes below proposal threshold',
        );
      });
    });

    describe('on vote', function () {
      it('if vote type is invalide', async function () {
        await this.helper.propose({ from: proposer });
        await this.helper.waitForSnapshot();
        await expectRevert(
          this.helper.vote({ support: 5 }, { from: voter1 }),
          'GovernorCompatibilityBravo: invalid vote type',
        );
      });
    });
  });

  describe('cancel', function () {
    it('proposer can cancel', async function () {
      await this.helper.propose({ from: proposer });
      await this.helper.cancel({ from: proposer });
    });

    it('anyone can cancel if proposer drop below threshold', async function () {
      await this.helper.propose({ from: proposer });
      await this.token.transfer(voter1, web3.utils.toWei('1'), { from: proposer });
      await this.helper.cancel();
    });

    it('cannot cancel is proposer is still above threshold', async function () {
      await this.helper.propose({ from: proposer });
      await expectRevert(this.helper.cancel(), 'GovernorBravo: proposer above threshold');
    });
  });
});
