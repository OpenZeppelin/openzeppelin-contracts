const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, ether, expectRevert, time } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const IncreasingPriceCrowdsaleImpl = contract.fromArtifact('IncreasingPriceCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('IncreasingPriceCrowdsale', function () {
  const [ investor, wallet, purchaser ] = accounts;

  const value = ether('1');
  const tokenSupply = new BN('10').pow(new BN('22'));

  describe('rate during crowdsale should change at a fixed step every block', async function () {
    const initialRate = new BN('9166');
    const finalRate = new BN('5500');
    const rateAtTime150 = new BN('9166');
    const rateAtTime300 = new BN('9165');
    const rateAtTime1500 = new BN('9157');
    const rateAtTime30 = new BN('9166');
    const rateAtTime150000 = new BN('8257');
    const rateAtTime450000 = new BN('6439');

    beforeEach(async function () {
      await time.advanceBlock();
      this.startTime = (await time.latest()).add(time.duration.weeks(1));
      this.closingTime = this.startTime.add(time.duration.weeks(1));
      this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));
      this.token = await SimpleToken.new();
    });

    it('reverts with a final rate larger than the initial rate', async function () {
      await expectRevert(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate.addn(1)
      ), 'IncreasingPriceCrowdsale: initial rate is not greater than final rate');
    });

    it('reverts with a final rate equal to the initial rate', async function () {
      await expectRevert(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, initialRate
      ), 'IncreasingPriceCrowdsale: initial rate is not greater than final rate');
    });

    it('reverts with a final rate of zero', async function () {
      await expectRevert(IncreasingPriceCrowdsaleImpl.new(
        this.startTime, this.closingTime, wallet, this.token.address, initialRate, 0
      ), 'IncreasingPriceCrowdsale: final rate is 0');
    });

    context('with crowdsale', function () {
      beforeEach(async function () {
        this.crowdsale = await IncreasingPriceCrowdsaleImpl.new(
          this.startTime, this.closingTime, wallet, this.token.address, initialRate, finalRate
        );
        await this.token.transfer(this.crowdsale.address, tokenSupply);
      });

      it('should have initial and final rate', async function () {
        expect(await this.crowdsale.initialRate()).to.be.bignumber.equal(initialRate);
        expect(await this.crowdsale.finalRate()).to.be.bignumber.equal(finalRate);
      });

      it('reverts when the base Crowdsale\'s rate function is called', async function () {
        await expectRevert(this.crowdsale.rate(),
          'IncreasingPriceCrowdsale: rate() called'
        );
      });

      it('returns a rate of 0 before the crowdsale starts', async function () {
        expect(await this.crowdsale.getCurrentRate()).to.be.bignumber.equal('0');
      });

      it('returns a rate of 0 after the crowdsale ends', async function () {
        await time.increaseTo(this.afterClosingTime);
        expect(await this.crowdsale.getCurrentRate()).to.be.bignumber.equal('0');
      });

      it('at start', async function () {
        await time.increaseTo(this.startTime);
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(initialRate));
      });

      it('at time 150', async function () {
        await time.increaseTo(this.startTime.addn(150));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime150));
      });

      it('at time 300', async function () {
        await time.increaseTo(this.startTime.addn(300));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime300));
      });

      it('at time 1500', async function () {
        await time.increaseTo(this.startTime.addn(1500));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime1500));
      });

      it('at time 30', async function () {
        await time.increaseTo(this.startTime.addn(30));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime30));
      });

      it('at time 150000', async function () {
        await time.increaseTo(this.startTime.addn(150000));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime150000));
      });

      it('at time 450000', async function () {
        await time.increaseTo(this.startTime.addn(450000));
        await this.crowdsale.buyTokens(investor, { value, from: purchaser });
        expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(value.mul(rateAtTime450000));
      });
    });
  });
});
