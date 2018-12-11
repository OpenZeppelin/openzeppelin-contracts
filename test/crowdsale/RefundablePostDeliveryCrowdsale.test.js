const time = require('../helpers/time');
const shouldFail = require('../helpers/shouldFail');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundablePostDeliveryCrowdsaleImpl = artifacts.require('RefundablePostDeliveryCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('RefundablePostDeliveryCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const tokenSupply = new BigNumber('1e22');
  const goal = ether(100);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()) + time.duration.weeks(1);
    this.closingTime = this.openingTime + time.duration.weeks(1);
    this.afterClosingTime = this.closingTime + time.duration.seconds(1);
    this.token = await SimpleToken.new();
    this.crowdsale = await RefundablePostDeliveryCrowdsaleImpl.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address, goal
    );
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  context('after opening time', function () {
    beforeEach(async function () {
      await time.increaseTo(this.openingTime);
    });

    context('with bought tokens below the goal', function () {
      const value = goal.sub(1);

      beforeEach(async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('does not immediately deliver tokens to beneficiaries', async function () {
        (await this.crowdsale.balanceOf(investor)).should.be.bignumber.equal(value);
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(0);
      });

      it('does not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await shouldFail.reverting(this.crowdsale.withdrawTokens(investor));
      });

      context('after closing time and finalization', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
          await this.crowdsale.finalize();
        });

        it('rejects token withdrawals', async function () {
          await shouldFail.reverting(this.crowdsale.withdrawTokens(investor));
        });
      });
    });

    context('with bought tokens matching the goal', function () {
      const value = goal;

      beforeEach(async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('does not immediately deliver tokens to beneficiaries', async function () {
        (await this.crowdsale.balanceOf(investor)).should.be.bignumber.equal(value);
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(0);
      });

      it('does not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await shouldFail.reverting(this.crowdsale.withdrawTokens(investor));
      });

      context('after closing time and finalization', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
          await this.crowdsale.finalize();
        });

        it('allows beneficiaries to withdraw tokens', async function () {
          await this.crowdsale.withdrawTokens(investor);
          (await this.crowdsale.balanceOf(investor)).should.be.bignumber.equal(0);
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(value);
        });

        it('rejects multiple withdrawals', async function () {
          await this.crowdsale.withdrawTokens(investor);
          await shouldFail.reverting(this.crowdsale.withdrawTokens(investor));
        });
      });
    });
  });
});
