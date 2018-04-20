import latestTime from '../../helpers/latestTime';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const TokenTimelock = artifacts.require('TokenTimelock');

contract('TokenTimelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  beforeEach(async function () {
    this.token = await MintableToken.new();
    await this.token.initialize(owner);
    this.releaseTime = latestTime() + duration.years(1);
    this.timelock = await TokenTimelock.new();
    await this.timelock.initialize(owner, this.token.address, beneficiary, this.releaseTime);
    await this.token.mint(this.timelock.address, amount, { from: owner });
  });

  it('cannot be released before time limit', async function () {
    await this.timelock.release().should.be.rejected;
  });

  it('cannot be released just before time limit', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    await this.timelock.release().should.be.rejected;
  });

  it('can be released just after limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    await this.timelock.release().should.be.fulfilled;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('can be released after time limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release().should.be.fulfilled;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });

  it('cannot be released twice', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.release().should.be.rejected;
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.be.bignumber.equal(amount);
  });
});
