const { assertRevert } = require('../helpers/assertRevert');
const { ether } = require('../helpers/ether');
const { ethGetBalance } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Crowdsale = artifacts.require('Crowdsale');
const SimpleToken = artifacts.require('SimpleToken');

contract('Crowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');
  const expectedTokenAmount = rate.mul(value);
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('requires a non-null token', async function () {
    await assertRevert(
      Crowdsale.new(rate, wallet, ZERO_ADDRESS)
    );
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
    });

    it('requires a non-zero rate', async function () {
      await assertRevert(
        Crowdsale.new(0, wallet, this.token.address)
      );
    });

    it('requires a non-null wallet', async function () {
      await assertRevert(
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
            await assertRevert(
              this.crowdsale.send(0, { from: purchaser })
            );
          });
        });

        describe('buyTokens', function () {
          it('should accept payments', async function () {
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await assertRevert(
              this.crowdsale.buyTokens(investor, { value: 0, from: purchaser })
            );
          });

          it('requires a non-null beneficiary', async function () {
            await assertRevert(
              this.crowdsale.buyTokens(ZERO_ADDRESS, { value: value, from: purchaser })
            );
          });
        });
      });

      describe('high-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
          const event = logs.find(e => e.event === 'TokensPurchased');
          should.exist(event);
          event.args.purchaser.should.equal(investor);
          event.args.beneficiary.should.equal(investor);
          event.args.value.should.be.bignumber.equal(value);
          event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({ value: value, from: investor });
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          const pre = await ethGetBalance(wallet);
          await this.crowdsale.sendTransaction({ value, from: investor });
          const post = await ethGetBalance(wallet);
          post.minus(pre).should.be.bignumber.equal(value);
        });
      });

      describe('low-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          const event = logs.find(e => e.event === 'TokensPurchased');
          should.exist(event);
          event.args.purchaser.should.equal(purchaser);
          event.args.beneficiary.should.equal(investor);
          event.args.value.should.be.bignumber.equal(value);
          event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should assign tokens to beneficiary', async function () {
          await this.crowdsale.buyTokens(investor, { value, from: purchaser });
          (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          const pre = await ethGetBalance(wallet);
          await this.crowdsale.buyTokens(investor, { value, from: purchaser });
          const post = await ethGetBalance(wallet);
          post.minus(pre).should.be.bignumber.equal(value);
        });
      });
    });
  });
});
