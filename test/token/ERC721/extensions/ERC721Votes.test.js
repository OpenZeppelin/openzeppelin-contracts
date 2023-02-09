/* eslint-disable */

const { BN, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { getChainId } = require('../../../helpers/chainid');

const { shouldBehaveLikeVotes } = require('../../../governance/utils/Votes.behavior');

const ERC721Votes = artifacts.require('$ERC721Votes');

contract('ERC721Votes', function (accounts) {
  const [account1, account2, account1Delegatee, other1, other2] = accounts;

  const name = 'My Vote';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.chainId = await getChainId();

    this.votes = await ERC721Votes.new(name, symbol, name, '1');

    this.NFT0 = new BN('10000000000000000000000000');
    this.NFT1 = new BN('10');
    this.NFT2 = new BN('20');
    this.NFT3 = new BN('30');
  });

  describe('balanceOf', function () {
    beforeEach(async function () {
      await this.votes.$_mint(account1, this.NFT0);
      await this.votes.$_mint(account1, this.NFT1);
      await this.votes.$_mint(account1, this.NFT2);
      await this.votes.$_mint(account1, this.NFT3);
    });

    it('grants to initial account', async function () {
      expect(await this.votes.balanceOf(account1)).to.be.bignumber.equal('4');
    });
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await this.votes.$_mint(account1, this.NFT0);
    });

    it('no delegation', async function () {
      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });
      expectEvent(receipt, 'Transfer', { from: account1, to: account2, tokenId: this.NFT0 });
      expectEvent.notEmitted(receipt, 'DelegateVotesChanged');

      this.account1Votes = '0';
      this.account2Votes = '0';
    });

    it('sender delegation', async function () {
      await this.votes.delegate(account1, { from: account1 });

      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });
      expectEvent(receipt, 'Transfer', { from: account1, to: account2, tokenId: this.NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: account1, previousBalance: '1', newBalance: '0' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(
        receipt.logs
          .filter(({ event }) => event == 'DelegateVotesChanged')
          .every(({ logIndex }) => transferLogIndex < logIndex),
      ).to.be.equal(true);

      this.account1Votes = '0';
      this.account2Votes = '0';
    });

    it('receiver delegation', async function () {
      await this.votes.delegate(account2, { from: account2 });

      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });
      expectEvent(receipt, 'Transfer', { from: account1, to: account2, tokenId: this.NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: account2, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(
        receipt.logs
          .filter(({ event }) => event == 'DelegateVotesChanged')
          .every(({ logIndex }) => transferLogIndex < logIndex),
      ).to.be.equal(true);

      this.account1Votes = '0';
      this.account2Votes = '1';
    });

    it('full delegation', async function () {
      await this.votes.delegate(account1, { from: account1 });
      await this.votes.delegate(account2, { from: account2 });

      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });
      expectEvent(receipt, 'Transfer', { from: account1, to: account2, tokenId: this.NFT0 });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: account1, previousBalance: '1', newBalance: '0' });
      expectEvent(receipt, 'DelegateVotesChanged', { delegate: account2, previousBalance: '0', newBalance: '1' });

      const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
      expect(
        receipt.logs
          .filter(({ event }) => event == 'DelegateVotesChanged')
          .every(({ logIndex }) => transferLogIndex < logIndex),
      ).to.be.equal(true);

      this.account1Votes = '0';
      this.account2Votes = '1';
    });

    it('returns the same total supply on transfers', async function () {
      await this.votes.delegate(account1, { from: account1 });

      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.votes.getPastTotalSupply(receipt.blockNumber - 1)).to.be.bignumber.equal('1');
      expect(await this.votes.getPastTotalSupply(receipt.blockNumber + 1)).to.be.bignumber.equal('1');

      this.account1Votes = '0';
      this.account2Votes = '0';
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function () {
      await this.votes.$_mint(account1, this.NFT1);
      await this.votes.$_mint(account1, this.NFT2);
      await this.votes.$_mint(account1, this.NFT3);

      const total = await this.votes.balanceOf(account1);

      const t1 = await this.votes.delegate(other1, { from: account1 });
      await time.advanceBlock();
      await time.advanceBlock();
      const t2 = await this.votes.transferFrom(account1, other2, this.NFT0, { from: account1 });
      await time.advanceBlock();
      await time.advanceBlock();
      const t3 = await this.votes.transferFrom(account1, other2, this.NFT2, { from: account1 });
      await time.advanceBlock();
      await time.advanceBlock();
      const t4 = await this.votes.transferFrom(other2, account1, this.NFT2, { from: other2 });
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber)).to.be.bignumber.equal(total);
      expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(total);
      expect(await this.votes.getPastVotes(other1, t2.receipt.blockNumber)).to.be.bignumber.equal('3');
      expect(await this.votes.getPastVotes(other1, t2.receipt.blockNumber + 1)).to.be.bignumber.equal('3');
      expect(await this.votes.getPastVotes(other1, t3.receipt.blockNumber)).to.be.bignumber.equal('2');
      expect(await this.votes.getPastVotes(other1, t3.receipt.blockNumber + 1)).to.be.bignumber.equal('2');
      expect(await this.votes.getPastVotes(other1, t4.receipt.blockNumber)).to.be.bignumber.equal('3');
      expect(await this.votes.getPastVotes(other1, t4.receipt.blockNumber + 1)).to.be.bignumber.equal('3');

      this.account1Votes = '0';
      this.account2Votes = '0';
    });

    afterEach(async function () {
      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(this.account1Votes);
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal(this.account2Votes);

      // need to advance 2 blocks to see the effect of a transfer on "getPastVotes"
      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.votes.getPastVotes(account1, blockNumber)).to.be.bignumber.equal(this.account1Votes);
      expect(await this.votes.getPastVotes(account2, blockNumber)).to.be.bignumber.equal(this.account2Votes);
    });
  });

  describe('Voting workflow', function () {
    beforeEach(async function () {
      this.account1 = account1;
      this.account1Delegatee = account1Delegatee;
      this.account2 = account2;
      this.name = 'My Vote';
    });

    // includes EIP6372 behavior check
    shouldBehaveLikeVotes();
  });
});
