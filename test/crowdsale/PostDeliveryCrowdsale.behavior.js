import { increaseTimeTo } from '../helpers/increaseTime';
import EVMRevert from '../helpers/EVMRevert';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

export default function (investor, purchaser, value, endCrowdsale) {
  describe('as a PostDeliveryCrowdsale', function () {
    context('before end', function () {
      it('should not immediately assign tokens to beneficiary', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
        const balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(0);
      });

      it('should not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
        await increaseTimeTo(this.beforeEndTime);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
        await this.crowdsale.withdrawTokens({ from: investor }).should.be.rejectedWith(EVMRevert);
      });
    });

    context('after end', function () {
      beforeEach(async function () {
        await endCrowdsale.call(this, investor, purchaser, value);
      });

      it('should return the amount of tokens bought', async function () {
        await this.crowdsale.withdrawTokens({ from: investor });
        const balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(value);
      });
    });
  });
};
