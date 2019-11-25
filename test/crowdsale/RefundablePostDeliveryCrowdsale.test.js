const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, ether, expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const RefundablePostDeliveryCrowdsaleImpl = contract.fromArtifact('RefundablePostDeliveryCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('RefundablePostDeliveryCrowdsale', function () {
  const [ investor, wallet, purchaser ] = accounts;

  const rate = new BN(1);
  const tokenSupply = new BN('10').pow(new BN('22'));
  const goal = ether('100');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.weeks(1));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));
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
      const value = goal.subn(1);

      beforeEach(async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('does not immediately deliver tokens to beneficiaries', async function () {
        expect(await this.crowdsale.balanceOf(investor)).to.be.bignumber.equal(value);
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal('0');
      });

      it('does not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await expectRevert(this.crowdsale.withdrawTokens(investor),
          'RefundablePostDeliveryCrowdsale: not finalized'
        );
      });

      context('after closing time and finalization', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
          await this.crowdsale.finalize();
        });

        it('rejects token withdrawals', async function () {
          await expectRevert(this.crowdsale.withdrawTokens(investor),
            'RefundablePostDeliveryCrowdsale: goal not reached'
          );
        });
      });
    });

    context('with bought tokens matching the goal', function () {
      const value = goal;

      beforeEach(async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });

      it('does not immediately deliver tokens to beneficiaries', async function () {
        expect(await this.crowdsale.balanceOf(investor)).to.be.bignumber.equal(value);
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal('0');
      });

      it('does not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await expectRevert(this.crowdsale.withdrawTokens(investor),
          'RefundablePostDeliveryCrowdsale: not finalized'
        );
      });

      context('after closing time and finalization', function () {
        beforeEach(async function () {
          await time.increaseTo(this.afterClosingTime);
          await this.crowdsale.finalize();
        });

        it('allows beneficiaries to withdraw tokens', async function () {
          await this.crowdsale.withdrawTokens(investor);
          expect(await this.crowdsale.balanceOf(investor)).to.be.bignumber.equal('0');
          expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value);
        });

        it('rejects multiple withdrawals', async function () {
          await this.crowdsale.withdrawTokens(investor);
          await expectRevert(this.crowdsale.withdrawTokens(investor),
            'PostDeliveryCrowdsale: beneficiary is not due any tokens'
          );
        });
      });
    });
  });
});
