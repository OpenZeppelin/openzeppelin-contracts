const { BN, ether, expectRevert, balance } = require('openzeppelin-test-helpers');

const OverPurchaseCrowdsaleImpl = artifacts.require('OverPurchaseCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('OverPurchaseCrowdsale', function ([_, wallet]) {
  const rate = new BN('1');
  const cap = ether('100');
  const moreThanCap = ether('110');
  const lessThanCap = ether('60');
  const tokenSupply = new BN('10').pow(new BN('22'));

  beforeEach(async function () {
    this.token = await SimpleToken.new();
    this.crowdsale = await OverPurchaseCrowdsaleImpl.new(rate, wallet, this.token.address, cap);
    await this.token.transfer(this.crowdsale.address, tokenSupply);
  });

  it('should accept payments within cap', async function () {
    await this.crowdsale.send(cap.sub(lessThanCap));
    await this.crowdsale.send(lessThanCap);
  });

  it('should accept payments that exceed cap with a refund', async function () {
    const tracker = await balance.tracker(wallet);

    await this.crowdsale.send(moreThanCap);
    (await tracker.delta()).should.be.bignumber.eq(cap);
  });

  it('should reject payments if cap reached', async function () {
    await this.crowdsale.send(cap);
    await expectRevert(this.crowdsale.send(cap.addn(1)), 'Crowdsale: weiAmount is 0');
  });
});
