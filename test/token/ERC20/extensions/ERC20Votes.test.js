/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { shouldBehaveLikeVotes } = require('../../../governance/utils/Votes.behavior');

const ERC20VotesMock = artifacts.require('ERC20VotesMock');
const { EIP712Domain } = require('../../../helpers/eip712');

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

contract('ERC20Votes', function (accounts) {
  const [ holder, recipient, holderDelegatee, other1, other2 ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';
  const supply = new BN('10000000000000000000000000');

  beforeEach(async function () {
    this.token = await ERC20VotesMock.new(name, symbol);

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.token.getChainId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(holder)).to.be.bignumber.equal('0');
  });

  it('minting restriction', async function () {
    const amount = new BN('2').pow(new BN('224'));
    await expectRevert(
      this.token.mint(holder, amount),
      'ERC20Votes: total supply risks overflowing votes',
    );
  });

  it('recent checkpoints', async function () {
    await this.token.delegate(holder, { from: holder });
    for (let i = 0; i < 6; i++) {
      await this.token.mint(holder, 1);
    }
    const block = await web3.eth.getBlockNumber();
    // recent
    expect(await this.token.getPastVotes(holder, block - 1)).to.be.bignumber.equal('5');
    // non-recent
    expect(await this.token.getPastVotes(holder, block - 6)).to.be.bignumber.equal('0');
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
    });

    it('no delegation', async function () {
      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('sender delegation', async function () {
      await this.token.delegate(holder, { from: holder });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: supply, newBalance: supply.subn(1) });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '0';
    });

    it('receiver delegation', async function () {
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    it('full delegation', async function () {
      await this.token.delegate(holder, { from: holder });
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: holder, previousBalance: supply, newBalance: supply.subn(1) });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: recipient, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '1';
    });

    afterEach(async function () {
      expect(await this.token.getVotes(holder)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getVotes(recipient)).to.be.bignumber.equal(this.recipientVotes);

      // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.token.getPastVotes(holder, blockNumber)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.getPastVotes(recipient, blockNumber)).to.be.bignumber.equal(this.recipientVotes);
    });
  });

  describe.only('Voting workflow', function () {
    beforeEach(async function () {
      this.account1 = holder;
      this.account1Delegatee = holderDelegatee;
      this.account2 = recipient;
      this.name = 'My Token';
      this.votes = this.token
      this.token0 = 1;      
      this.token1 = 1;
      this.token2 = 1;
      this.token3 = 1;
    });

    shouldBehaveLikeVotes();
  });
});
