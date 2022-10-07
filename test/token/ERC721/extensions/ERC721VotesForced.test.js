/* eslint-disable */

const { BN, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { promisify } = require('util');
const queue = promisify(setImmediate);

const ERC721VotesMock = artifacts.require('ERC721VotesForcedMock');

const { shouldBehaveLikeVotesForced } = require('../../../governance/utils/VotesForced.behavior');

contract('ERC721VotesForced', function (accounts) {
  const [ account1, account2, account1Delegatee, other1, other2 ] = accounts;
  this.name = 'My Vote';
  const symbol = 'MTKN';
  const powerCalc = (tokenId) => (tokenId * 2);

  beforeEach(async function () {
    this.votes = await ERC721VotesMock.new(name, symbol);

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.votes.getChainId();

    this.NFT0 = new BN('10000000000000');
    this.NFT1 = new BN('10');
    this.NFT2 = new BN('20');
    this.NFT3 = new BN('30');
    this.NFT0power = powerCalc(Number(this.NFT0)).toString();
    this.totalVotingPower = powerCalc(Number(this.NFT0))
        + powerCalc(Number(this.NFT1))
        + powerCalc(Number(this.NFT2))
        + powerCalc(Number(this.NFT3));
    
  });

  describe('balanceOf', function () {
    beforeEach(async function () {
      await this.votes.mint(account1, this.NFT0);
      await this.votes.mint(account1, this.NFT1);
      await this.votes.mint(account1, this.NFT2);
      await this.votes.mint(account1, this.NFT3);
    });

    it('grants to initial account', async function () {
      expect(await this.votes.balanceOf(account1)).to.be.bignumber.equal('4');
    });

    it('has adjusted units by default', async function () {
        expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(this.totalVotingPower.toString());
      });
  });

  describe('transfers', function () {
    
    beforeEach(async function () {
      await this.votes.mint(account1, this.NFT0);
    });

    it('transfer token with power', async function () {
        const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });
        expectEvent(receipt, 'Transfer', { from: account1, to: account2, tokenId: this.NFT0 });
        expectEvent(receipt, 'DelegateVotesChanged', { delegate: account1, previousBalance: this.NFT0power, newBalance: '0' });
        expectEvent(receipt, 'DelegateVotesChanged', { delegate: account2, previousBalance: '0', newBalance: this.NFT0power });

        const { logIndex: transferLogIndex } = receipt.logs.find(({ event }) => event == 'Transfer');
        expect(receipt.logs.filter(({ event }) => event == 'DelegateVotesChanged').every(({ logIndex }) => transferLogIndex < logIndex)).to.be.equal(true);

        this.account1Votes = '0';
        this.account2Votes = this.NFT0power;
    });

    it('returns the same total supply on transfers', async function () {
      const { receipt } = await this.votes.transferFrom(account1, account2, this.NFT0, { from: account1 });

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.votes.getPastTotalSupply(receipt.blockNumber - 1)).to.be.bignumber.equal(this.NFT0power);
      expect(await this.votes.getPastTotalSupply(receipt.blockNumber + 1)).to.be.bignumber.equal(this.NFT0power);

      this.account1Votes = '0';
      this.account2Votes = this.NFT0power;
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function () {
      await this.votes.mint(account1, this.NFT1);
      await this.votes.mint(account1, this.NFT2);
      await this.votes.mint(account1, this.NFT3);
      const NFT1power = powerCalc(Number(this.NFT1));
      const NFT2power = powerCalc(Number(this.NFT2));
      const NFT3power = powerCalc(Number(this.NFT3));
    //   const totalPower = NFT1power + NFT2power + NFT3power;

    //   const total = await this.votes.balanceOf(account1);

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

        //Power of tokens 0,1,2,3
        expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber)).to.be.bignumber.equal(this.totalVotingPower.toString());
        expect(await this.votes.getPastVotes(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(this.totalVotingPower.toString());

        //Power of Tokens 1,2,3
        let expectedPower2 = (powerCalc(Number(this.NFT1)) + powerCalc(Number(this.NFT2)) + powerCalc(Number(this.NFT3)));
        expect(await this.votes.getPastVotes(other1, t2.receipt.blockNumber)).to.be.bignumber.equal(expectedPower2.toString());
        expect(await this.votes.getPastVotes(other1, t2.receipt.blockNumber + 1)).to.be.bignumber.equal(expectedPower2.toString());

        //Power of Tokens 1,3
        let expectedPower3 = (powerCalc(Number(this.NFT1)) + powerCalc(Number(this.NFT3)));
        expect(await this.votes.getPastVotes(other1, t3.receipt.blockNumber)).to.be.bignumber.equal(expectedPower3.toString());
        expect(await this.votes.getPastVotes(other1, t3.receipt.blockNumber + 1)).to.be.bignumber.equal(expectedPower3.toString());

        //Power of Tokens 1,2,3
        expect(await this.votes.getPastVotes(other1, t4.receipt.blockNumber)).to.be.bignumber.equal(expectedPower2.toString());
        expect(await this.votes.getPastVotes(other1, t4.receipt.blockNumber + 1)).to.be.bignumber.equal(expectedPower2.toString());

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

    shouldBehaveLikeVotesForced();
  });
});
