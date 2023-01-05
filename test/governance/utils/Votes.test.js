const { constants, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const {
  shouldBehaveLikeVotes,
} = require('./Votes.behavior');

const Votes = artifacts.require('VotesMock');

contract('Votes', function (accounts) {
  const [ account1, account2, account3 ] = accounts;
  const tokens = [
    '10000000000000000000000000',
    '10',
    '20',
    '30',
  ].map(web3.utils.toBN);

  beforeEach(async function () {
    this.name = 'My Vote';
    this.votes = await Votes.new(this.name);
  });

  it('starts with zero votes', async function () {
    expect(await this.votes.getTotalSupply()).to.be.bignumber.equal('0');
  });

  describe('performs voting operations', function () {
    beforeEach(async function () {
      this.amounts = {
        [account1]: web3.utils.toBN(1),
        [account2]: web3.utils.toBN(17),
        [account3]: web3.utils.toBN(42),
      };
      this.txs = await Promise.all(Object.entries(this.amounts).map(kv => this.votes.mint(...kv)));
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.votes.getPastTotalSupply(this.txs.at(-1).receipt.blockNumber + 1),
        'Votes: block not yet mined',
      );
    });

    it('delegates', async function () {
      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal('0');
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(constants.ZERO_ADDRESS);
      expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

      await this.votes.delegate(account1, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(this.amounts[account1]);
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(account1);
      expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

      await this.votes.delegate(account2, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(
        this.amounts[account1].add(this.amounts[account2]),
      );
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(account1);
      expect(await this.votes.delegates(account2)).to.be.equal(account1);
    });

    it('cross delegates', async function () {
      await this.votes.delegate(account1, account2);
      await this.votes.delegate(account2, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(this.amounts[account2]);
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal(this.amounts[account1]);
    });

    it('returns total amount of votes', async function () {
      const totalSupply = Object.values(this.amounts).reduce((acc, value) => acc.add(value), web3.utils.toBN(0));
      expect(await this.votes.getTotalSupply()).to.be.bignumber.equal(totalSupply);
    });
  });

  describe('performs voting workflow', function () {
    beforeEach(async function () {
      this.chainId = await this.votes.getChainId();
    });

    shouldBehaveLikeVotes(accounts, tokens);
  });
});
