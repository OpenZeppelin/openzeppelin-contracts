const expectEvent = require('../helpers/expectEvent');
const shouldFail = require('../helpers/shouldFail');
const { balanceDifference } = require('../helpers/balanceDifference');
const { ether } = require('../helpers/ether');
const { ZERO_ADDRESS } = require('../helpers/constants');

const { BigNumber } = require('../helpers/setup');

const ERC20FundedCrowdsale = artifacts.require('ERC20FundedCrowdsaleMock');
const SimpleToken = artifacts.require('SimpleToken');
const ERC20Mock = artifacts.require('ERC20Mock');

contract('ERC20FundedCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');
  const expectedTokenAmount = rate.mul(value);

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
    });

    it('requires a non-null funding token', async function () {
      await shouldFail.reverting(
        ERC20FundedCrowdsale.new(rate, wallet, this.token.address, ZERO_ADDRESS)
      );
    });

    context('once deployed', async function () {
      beforeEach(async function () {
        this.fundingToken = await ERC20Mock.new(purchaser, tokenSupply);

        this.crowdsale = await ERC20FundedCrowdsale.new(rate, wallet, this.token.address, this.fundingToken.address);
        await this.token.transfer(this.crowdsale.address, tokenSupply);

        await this.fundingToken.approve(this.crowdsale.address, value, { from: purchaser });
      });

      describe('accepting payments', function () {
        describe('bare payments', function () {
          it('should accept payments', async function () {
            await this.crowdsale.sendTransaction({ from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await shouldFail.reverting(
              this.crowdsale.send(0, { from: investor })
            );
          });
        });

        describe('buyTokens', function () {
          it('should accept payments', async function () {
            await this.crowdsale.buyTokens(investor, { from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await shouldFail.reverting(
              this.crowdsale.buyTokens(investor, { from: investor })
            );
          });

          it('requires a non-null beneficiary', async function () {
            await shouldFail.reverting(
              this.crowdsale.buyTokens(ZERO_ADDRESS, { from: purchaser })
            );
          });
        });
      });

      describe('high-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.sendTransaction({ from: purchaser });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser,
            beneficiary: purchaser,
            value: 0,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({ from: purchaser });
          (await this.token.balanceOf(purchaser)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          (await balanceDifference(wallet, () =>
            this.crowdsale.sendTransaction({ from: purchaser }))
          ).should.be.bignumber.equal(0);
          (await this.fundingToken.balanceOf(wallet)).should.be.bignumber.equal(value);
        });
      });

      describe('low-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.buyTokens(investor, { from: purchaser });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser: purchaser,
            beneficiary: investor,
            value: 0,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to beneficiary', async function () {
          await this.crowdsale.buyTokens(investor, { from: purchaser });
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          (await balanceDifference(wallet, () =>
            this.crowdsale.buyTokens(investor, { from: purchaser }))
          ).should.be.bignumber.equal(0);
          (await this.fundingToken.balanceOf(wallet)).should.be.bignumber.equal(value);
        });
      });
    });
  });
});
