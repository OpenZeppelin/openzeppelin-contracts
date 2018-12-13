const expectEvent = require('../helpers/expectEvent');
const shouldFail = require('../helpers/shouldFail');
const { balanceDifference } = require('../helpers/balanceDifference');
const { ether } = require('../helpers/ether');
const { ZERO_ADDRESS } = require('../helpers/constants');

const { BigNumber } = require('../helpers/setup');

const Crowdsale = artifacts.require('CrowdsaleMock');
const SimpleToken = artifacts.require('SimpleToken');

contract('Crowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');
  const expectedTokenAmount = rate.mul(value);

  it('requires a non-null token', async function () {
    await shouldFail.reverting(
      Crowdsale.new(rate, wallet, ZERO_ADDRESS)
    );
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
    });

    it('requires a non-zero rate', async function () {
      await shouldFail.reverting(
        Crowdsale.new(0, wallet, this.token.address)
      );
    });

    it('requires a non-null wallet', async function () {
      await shouldFail.reverting(
        Crowdsale.new(rate, ZERO_ADDRESS, this.token.address)
      );
    });

    context('once deployed', async function () {
      beforeEach(async function () {
        this.crowdsale = await Crowdsale.new(rate, wallet, this.token.address);
        await this.token.transfer(this.crowdsale.address, tokenSupply);
      });

      describe('accepting payments', function () {
        describe('bare payments', function () {
          it('should accept payments', async function () {
            await this.crowdsale.send(value, { from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await shouldFail.reverting(
              this.crowdsale.send(0, { from: purchaser })
            );
          });
        });

        describe('buyTokens', function () {
          it('should accept payments', async function () {
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await shouldFail.reverting(
              this.crowdsale.buyTokens(investor, { value: 0, from: purchaser })
            );
          });

          it('requires a non-null beneficiary', async function () {
            await shouldFail.reverting(
              this.crowdsale.buyTokens(ZERO_ADDRESS, { value: value, from: purchaser })
            );
          });
        });
      });

      describe('high-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser: investor,
            beneficiary: investor,
            value: value,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({ value: value, from: investor });
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          (await balanceDifference(wallet, () =>
            this.crowdsale.sendTransaction({ value, from: investor }))
          ).should.be.bignumber.equal(value);
        });
      });

      describe('low-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser: purchaser,
            beneficiary: investor,
            value: value,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to beneficiary', async function () {
          await this.crowdsale.buyTokens(investor, { value, from: purchaser });
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          (await balanceDifference(wallet, () =>
            this.crowdsale.buyTokens(investor, { value, from: purchaser }))
          ).should.be.bignumber.equal(value);
        });
      });
    });
  });
});
