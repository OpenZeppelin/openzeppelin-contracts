const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;
const Enums = require('../helpers/enums');
const { EIP712Domain } = require('../helpers/eip712');
const { fromRpcSig } = require('ethereumjs-util');
const GovernorHelper = require('./helper');

const {
  shouldSupportInterfaces,
} = require('../utils/introspection/SupportsInterface.behavior');

const Token = artifacts.require('ERC20VotesMock');
const Governor = artifacts.require('GovernorMock');
const CallReceiver = artifacts.require('CallReceiverMock');

const helper = new GovernorHelper();

contract('Governor', function (accounts) {
  const [ owner, proposer, voter1, voter2, voter3, voter4 ] = accounts;

  const name = 'OZ-Governor';
  const version = '1';
  const tokenName = 'MockToken';
  const tokenSymbol = 'MTKN';
  const tokenSupply = web3.utils.toWei('100');
  const votingDelay = new BN(4);
  const votingPeriod = new BN(16);

  beforeEach(async function () {
    this.chainId = await web3.eth.getChainId();
    this.token = await Token.new(tokenName, tokenSymbol);
    this.mock = await Governor.new(name, this.token.address, votingDelay, votingPeriod, 10);
    this.receiver = await CallReceiver.new();
    await this.token.mint(owner, tokenSupply);
    await this.token.delegate(voter1, { from: voter1 });
    await this.token.delegate(voter2, { from: voter2 });
    await this.token.delegate(voter3, { from: voter3 });
    await this.token.delegate(voter4, { from: voter4 });

    helper.setGovernor(this.mock);
  });

  shouldSupportInterfaces([
    'ERC165',
    'Governor',
  ]);

  it('deployment check', async function () {
    expect(await this.mock.name()).to.be.equal(name);
    expect(await this.mock.token()).to.be.equal(this.token.address);
    expect(await this.mock.votingDelay()).to.be.bignumber.equal(votingDelay);
    expect(await this.mock.votingPeriod()).to.be.bignumber.equal(votingPeriod);
    expect(await this.mock.quorum(0)).to.be.bignumber.equal('0');
    expect(await this.mock.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
  });

  it('nominal workflow', async function () {
    const value = web3.utils.toWei('1');

    await web3.eth.sendTransaction({ from: owner, to: this.mock.address, value });
    await this.token.transfer(voter1, web3.utils.toWei('1'), { from: owner });
    await this.token.transfer(voter2, web3.utils.toWei('7'), { from: owner });
    await this.token.transfer(voter3, web3.utils.toWei('5'), { from: owner });
    await this.token.transfer(voter4, web3.utils.toWei('2'), { from: owner });

    // Before
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

    // Set Proposal
    const { id, proposal, shortProposal } = await helper.setProposal([
      [ this.receiver.address ],
      [ value ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    const txPropose = await helper.propose({ from: proposer });

    expectEvent(
      txPropose,
      'ProposalCreated',
      {
        proposalId: id,
        proposer,
        targets: shortProposal[0],
        // values: shortProposal[1],
        signatures: shortProposal[2].map(() => ''),
        calldatas: shortProposal[2],
        startBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay),
        endBlock: new BN(txPropose.receipt.blockNumber).add(votingDelay).add(votingPeriod),
        description: proposal.last(),
      },
    );

    await helper.waitForSnapshot();

    expectEvent(
      await helper.vote({ support: Enums.VoteType.For, reason: 'This is nice' }, { from: voter1 }),
      'VoteCast',
      { voter: voter1, support: Enums.VoteType.For, reason: 'This is nice' },
    );

    expectEvent(
      await helper.vote({ support: Enums.VoteType.For }, { from: voter2 }),
      'VoteCast',
      { voter: voter2, support: Enums.VoteType.For },
    );

    expectEvent(
      await helper.vote({ support: Enums.VoteType.Against }, { from: voter3 }),
      'VoteCast',
      { voter: voter3, support: Enums.VoteType.Against },
    );

    expectEvent(
      await helper.vote({ support: Enums.VoteType.Abstain }, { from: voter4 }),
      'VoteCast',
      { voter: voter4, support: Enums.VoteType.Abstain },
    );

    await helper.waitForDeadline();

    const txExecute = await helper.execute();

    expectEvent(
      txExecute,
      'ProposalExecuted',
      { proposalId: id },
    );

    await expectEvent.inTransaction(
      txExecute.tx,
      this.receiver,
      'MockFunctionCalled',
    );

    // After
    expect(await this.mock.hasVoted(id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(id, voter1)).to.be.equal(true);
    expect(await this.mock.hasVoted(id, voter2)).to.be.equal(true);
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);
  });

  it('vote with signature', async function () {
    const voterBySig = Wallet.generate();
    const voterBySigAddress = web3.utils.toChecksumAddress(voterBySig.getAddressString());

    const signature = async (message) => {
      return fromRpcSig(ethSigUtil.signTypedMessage(
        voterBySig.getPrivateKey(),
        {
          data: {
            types: {
              EIP712Domain,
              Ballot: [
                { name: 'proposalId', type: 'uint256' },
                { name: 'support', type: 'uint8' },
              ],
            },
            domain: { name, version, chainId: this.chainId, verifyingContract: this.mock.address },
            primaryType: 'Ballot',
            message,
          },
        },
      ));
    };

    await this.token.delegate(voterBySigAddress, { from: voter1 });
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    const { id } = await helper.setProposal([
      [ this.receiver.address ],
      [ web3.utils.toWei('0') ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    expectEvent(
      await helper.vote({ support: Enums.VoteType.For, signature }),
      'VoteCast',
      { voter: voterBySigAddress, support: Enums.VoteType.For },
    );
    await helper.waitForDeadline();
    await helper.execute();

    // After
    expect(await this.mock.hasVoted(id, owner)).to.be.equal(false);
    expect(await this.mock.hasVoted(id, voter1)).to.be.equal(false);
    expect(await this.mock.hasVoted(id, voter2)).to.be.equal(false);
    expect(await this.mock.hasVoted(id, voterBySigAddress)).to.be.equal(true);
  });

  it('send ethers', async function () {
    this.receiver = { address: web3.utils.toChecksumAddress(web3.utils.randomHex(20)) };
    const value = web3.utils.toWei('1');

    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });
    await web3.eth.sendTransaction({ from: owner, to: this.mock.address, value: value });

    // Before
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal(value);
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal('0');

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ value ],
      [ '0x' ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await helper.waitForDeadline();
    await helper.execute();

    // After
    expect(await web3.eth.getBalance(this.mock.address)).to.be.bignumber.equal('0');
    expect(await web3.eth.getBalance(this.receiver.address)).to.be.bignumber.equal(value);
  });

  it('receiver revert without reason', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunctionRevertsNoReason().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await helper.waitForDeadline();
    await expectRevert(helper.execute(), 'Governor: call reverted without message');
  });

  it('receiver revert with reason', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunctionRevertsReason().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await helper.waitForDeadline();
    await expectRevert(helper.execute(), 'CallReceiverMock: reverting');
  });

  it('missing proposal', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await expectRevert(helper.vote({ support: Enums.VoteType.For }, { from: voter1 }), 'Governor: unknown proposal id');
    await expectRevert(helper.execute(), 'Governor: unknown proposal id');
  });

  it('missing proposal', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await expectRevert(helper.propose(), 'Governor: proposal already exists');
  });

  it('duplicate executed proposal', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await helper.waitForDeadline();
    await helper.execute();
    await expectRevert(helper.propose(), 'Governor: proposal already exists');
    await expectRevert(helper.execute(), 'Governor: proposal not successful');
  });

  it('invalid vote type', async function () {
    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await expectRevert(
      helper.vote({ support: new BN('255') }),
      'GovernorVotingSimple: invalid value for enum VoteType',
    );
  });

  it('double cast', async function () {
    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await expectRevert(
      helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
      'GovernorVotingSimple: vote already cast',
    );
  });

  it('quorum not reached', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('5'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await expectRevert(helper.execute(), 'Governor: proposal not successful');
  });

  it('score not reached', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.Against }, { from: voter1 });
    await expectRevert(helper.execute(), 'Governor: proposal not successful');
  });

  it('vote not over', async function () {
    await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

    // Set Proposal
    await helper.setProposal([
      [ this.receiver.address ],
      [ 0 ],
      [ this.receiver.contract.methods.mockFunction().encodeABI() ],
      '<proposal description>',
    ]);

    // Run proposal
    await helper.propose();
    await helper.waitForSnapshot();
    await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
    await expectRevert(helper.execute(), 'Governor: proposal not successful');
  });

  describe('unit checks', function () {
    beforeEach(async function () {
      await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });

      this.details = await helper.setProposal([
        [ this.receiver.address ],
        [ 0 ],
        [ this.receiver.contract.methods.mockFunction().encodeABI() ],
        '<proposal description>',
      ]);
    });

    describe('state', function () {
      it('Unset', async function () {
        await expectRevert(this.mock.state(this.details.id), 'Governor: unknown proposal id');
      });

      it('Pending & Active', async function () {
        await helper.propose();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
        await helper.waitForSnapshot();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Pending);
        await helper.waitForSnapshot(+1);
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
      });

      it('Defeated', async function () {
        await helper.propose();
        await helper.waitForDeadline();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
        await helper.waitForDeadline(+1);
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Defeated);
      });

      it('Succeeded', async function () {
        await helper.propose();
        await helper.waitForSnapshot();
        await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helper.waitForDeadline();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Active);
        await helper.waitForDeadline(+1);
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Succeeded);
      });

      it('Executed', async function () {
        await helper.propose();
        await helper.waitForSnapshot();
        await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helper.waitForDeadline();
        await helper.execute();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Executed);
      });
    });

    describe('cancel', function () {
      it('before proposal', async function () {
        await expectRevert(helper.cancel(), 'Governor: unknown proposal id');
      });

      it('after proposal', async function () {
        await helper.propose();

        await helper.cancel();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await helper.waitForSnapshot();
        await expectRevert(
          helper.vote({ support: Enums.VoteType.For }, { from: voter1 }),
          'Governor: vote not currently active',
        );
      });

      it('after vote', async function () {
        await helper.propose();
        await helper.waitForSnapshot();
        await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });

        await helper.cancel();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await helper.waitForDeadline();
        await expectRevert(helper.execute(), 'Governor: proposal not successful');
      });

      it('after deadline', async function () {
        await helper.propose();
        await helper.waitForSnapshot();
        await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helper.waitForDeadline();

        await helper.cancel();
        expect(await this.mock.state(this.details.id)).to.be.bignumber.equal(Enums.ProposalState.Canceled);

        await expectRevert(helper.execute(), 'Governor: proposal not successful');
      });

      it('after execution', async function () {
        await helper.propose();
        await helper.waitForSnapshot();
        await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
        await helper.waitForDeadline();
        await helper.execute();

        await expectRevert(helper.cancel(), 'Governor: proposal not active');
      });
    });
  });

  describe('proposal length', function () {
    it('empty', async function () {
      await helper.setProposal([
        [],
        [],
        [],
        '<proposal description>',
      ]);
      await expectRevert(helper.propose(), 'Governor: empty proposal');
    });

    it('missmatch #1', async function () {
      await helper.setProposal([
        [ ],
        [ web3.utils.toWei('0') ],
        [ this.receiver.contract.methods.mockFunction().encodeABI() ],
        '<proposal description>',
      ]);
      await expectRevert(helper.propose(), 'Governor: invalid proposal length');
    });

    it('missmatch #2', async function () {
      await helper.setProposal([
        [ this.receiver.address ],
        [ ],
        [ this.receiver.contract.methods.mockFunction().encodeABI() ],
        '<proposal description>',
      ]);
      await expectRevert(helper.propose(), 'Governor: invalid proposal length');
    });

    it('missmatch #3', async function () {
      await helper.setProposal([
        [ this.receiver.address ],
        [ web3.utils.toWei('0') ],
        [ ],
        '<proposal description>',
      ]);
      await expectRevert(helper.propose(), 'Governor: invalid proposal length');
    });
  });

  describe('Settings update', function () {
    beforeEach(async function () {
      await this.token.transfer(voter1, web3.utils.toWei('10'), { from: owner });
    });

    it('setVotingDelay', async function () {
      await helper.setProposal([
        [ this.mock.address ],
        [ web3.utils.toWei('0') ],
        [ this.mock.contract.methods.setVotingDelay('0').encodeABI() ],
        '<proposal description>',
      ]);

      await helper.propose();
      await helper.waitForSnapshot();
      await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await helper.waitForDeadline();

      expectEvent(
        await helper.execute(),
        'VotingDelaySet',
        { oldVotingDelay: '4', newVotingDelay: '0' },
      );

      expect(await this.mock.votingDelay()).to.be.bignumber.equal('0');
    });

    it('setVotingPeriod', async function () {
      await helper.setProposal([
        [ this.mock.address ],
        [ web3.utils.toWei('0') ],
        [ this.mock.contract.methods.setVotingPeriod('32').encodeABI() ],
        '<proposal description>',
      ]);

      await helper.propose();
      await helper.waitForSnapshot();
      await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await helper.waitForDeadline();

      expectEvent(
        await helper.execute(),
        'VotingPeriodSet',
        { oldVotingPeriod: '16', newVotingPeriod: '32' },
      );

      expect(await this.mock.votingPeriod()).to.be.bignumber.equal('32');
    });

    it('setVotingPeriod to 0', async function () {
      await helper.setProposal([
        [ this.mock.address ],
        [ web3.utils.toWei('0') ],
        [ this.mock.contract.methods.setVotingPeriod('0').encodeABI() ],
        '<proposal description>',
      ]);

      await helper.propose();
      await helper.waitForSnapshot();
      await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await helper.waitForDeadline();

      await expectRevert(helper.execute(), 'GovernorSettings: voting period too low');
    });

    it('setProposalThreshold to 0', async function () {
      await helper.setProposal([
        [ this.mock.address ],
        [ web3.utils.toWei('0') ],
        [ this.mock.contract.methods.setProposalThreshold('1000000000000000000').encodeABI() ],
        '<proposal description>',
      ]);

      await helper.propose();
      await helper.waitForSnapshot();
      await helper.vote({ support: Enums.VoteType.For }, { from: voter1 });
      await helper.waitForDeadline();

      expectEvent(
        await helper.execute(),
        'ProposalThresholdSet',
        { oldProposalThreshold: '0', newProposalThreshold: '1000000000000000000' },
      );

      expect(await this.mock.proposalThreshold()).to.be.bignumber.equal('1000000000000000000');
    });

    describe('update protected', function () {
      it('setVotingDelay', async function () {
        await expectRevert(this.mock.setVotingDelay('0'), 'Governor: onlyGovernance');
      });

      it('setVotingPeriod', async function () {
        await expectRevert(this.mock.setVotingPeriod('32'), 'Governor: onlyGovernance');
      });

      it('setProposalThreshold', async function () {
        await expectRevert(this.mock.setProposalThreshold('1000000000000000000'), 'Governor: onlyGovernance');
      });
    });
  });
});
