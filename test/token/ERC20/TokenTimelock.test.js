const { latestTime } = require('../../helpers/latestTime');
const { increaseTimeTo, duration } = require('../../helpers/increaseTime');
const { expectThrow } = require('../../helpers/expectThrow');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenTimelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
    this.releaseTime = (await latestTime()) + duration.years(1);
    this.timelock = await TokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
    await this.token.mint(this.timelock.address, amount, { from: owner });
  });

  it('cannot be released before time limit', async function () {
    await expectThrow(this.timelock.release());
  });

  it('cannot be released just before time limit', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    await expectThrow(this.timelock.release());
  });

  it('can be released just after limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    await this.timelock.release();
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('can be released after time limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release();
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('cannot be released twice', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release();
    await expectThrow(this.timelock.release());
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });
});
