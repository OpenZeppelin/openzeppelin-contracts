const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const PostDeliveryCrowdsale = artifacts.require('PostDeliveryCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('PostDeliveryCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await SimpleToken.new();
    this.crowdsale = await PostDeliveryCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address
    );
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  context('after opening time', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });

    context('with bought tokens', function () {
      const value = ether(42);

      beforeEach(async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('does not immediately assign tokens to beneficiaries', async function () {
        (await this.crowdsale.balanceOf(investor)).should.be.bignumber.equal(value);
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(0);
      });

      it('does not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await expectThrow(this.crowdsale.withdrawTokens(investor), EVMRevert);
      });

      context('after closing time', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.afterClosingTime);
        });

        it('allows beneficiaries to withdraw tokens', async function () {
          await this.crowdsale.withdrawTokens(investor);
          (await this.crowdsale.balanceOf(investor)).should.be.bignumber.equal(0);
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(value);
        });

        it('rejects multiple withdrawals', async function () {
          await this.crowdsale.withdrawTokens(investor);
          await expectThrow(this.crowdsale.withdrawTokens(investor), EVMRevert);
        });
      });
    });
  });
});
