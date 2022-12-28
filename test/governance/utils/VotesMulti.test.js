const { expectRevert, BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const {
  shouldBehaveLikeVotesMulti,
} = require('./VotesMulti.behavior');

const VotesMulti = artifacts.require('VotesMultiMock');

contract('VotesMulti', function (accounts) {
  const [ account1, account2, account3 ] = accounts;
  beforeEach(async function () {
    this.name = 'My Vote';
    this.tokenId = new BN('4');
    this.data = '0x12345678';
    this.votes = await VotesMulti.new(this.name);
  });

  it('starts with zero votes', async function () {
    expect(await this.votes.getTotalSupply(0)).to.be.bignumber.equal('0');
    expect(await this.votes.getTotalSupply(this.tokenId)).to.be.bignumber.equal('0');
  });

  describe('performs voting operations', function () {
    beforeEach(async function () {
      this.tx1 = await this.votes.mint(account1, this.tokenId, 1, this.data);
      this.tx2 = await this.votes.mint(account2, this.tokenId, 1, this.data);
      this.tx3 = await this.votes.mint(account3, this.tokenId, 1, this.data);
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.votes.getPastTotalSupply(this.tokenId, this.tx3.receipt.blockNumber + 1),
        'Votes: block not yet mined',
      );
    });

    it('delegates', async function () {
      await this.votes.delegate(account3, this.tokenId, account2);

      expect(await this.votes.delegates(account3, this.tokenId)).to.be.equal(account2);
    });

    it('returns total amount of votes', async function () {
      expect(await this.votes.getTotalSupply(this.tokenId)).to.be.bignumber.equal('3');
    });
  });

  describe('performs voting workflow', function () {
    beforeEach(async function () {
      this.chainId = await this.votes.getChainId();
      this.account1 = account1;
      this.account2 = account2;
      this.account1Delegatee = account2;
      this.token0 = new BN('10000000000000000000000000');
      this.token1 = new BN('10');
      this.token2 = new BN('20');
      this.token3 = new BN('30');
    });

    shouldBehaveLikeVotesMulti();
  });
});
