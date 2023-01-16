const { constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { getChainId } = require('../../helpers/chainid');
const { BNsum } = require('../../helpers/math');

require('array.prototype.at/auto');

const { shouldBehaveLikeVotes } = require('./Votes.behavior');

const Votes = artifacts.require('$VotesMock');

contract('Votes', function (accounts) {
  const [account1, account2, account3] = accounts;
  const amounts = {
    [account1]: web3.utils.toBN('10000000000000000000000000'),
    [account2]: web3.utils.toBN('10'),
    [account3]: web3.utils.toBN('20'),
  };

  beforeEach(async function () {
    this.name = 'My Vote';
    this.votes = await Votes.new(this.name, '1');
  });

  it('starts with zero votes', async function () {
    expect(await this.votes.getTotalSupply()).to.be.bignumber.equal('0');
  });

  describe('performs voting operations', function () {
    beforeEach(async function () {
      this.txs = [];
      for (const [account, amount] of Object.entries(amounts)) {
        this.txs.push(await this.votes.$_mint(account, amount));
      }
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.votes.getPastTotalSupply(this.txs.at(-1).receipt.blockNumber + 1),
        'Checkpoints: block not yet mined',
      );
    });

    it('delegates', async function () {
      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal('0');
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(constants.ZERO_ADDRESS);
      expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

      await this.votes.delegate(account1, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account1]);
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(account1);
      expect(await this.votes.delegates(account2)).to.be.equal(constants.ZERO_ADDRESS);

      await this.votes.delegate(account2, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account1].add(amounts[account2]));
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal('0');
      expect(await this.votes.delegates(account1)).to.be.equal(account1);
      expect(await this.votes.delegates(account2)).to.be.equal(account1);
    });

    it('cross delegates', async function () {
      await this.votes.delegate(account1, account2);
      await this.votes.delegate(account2, account1);

      expect(await this.votes.getVotes(account1)).to.be.bignumber.equal(amounts[account2]);
      expect(await this.votes.getVotes(account2)).to.be.bignumber.equal(amounts[account1]);
    });

    it('returns total amount of votes', async function () {
      const totalSupply = BNsum(...Object.values(amounts));
      expect(await this.votes.getTotalSupply()).to.be.bignumber.equal(totalSupply);
    });
  });

  describe('performs voting workflow', function () {
    beforeEach(async function () {
      this.chainId = await getChainId();
    });

    shouldBehaveLikeVotes(accounts, Object.values(amounts));
  });
});
