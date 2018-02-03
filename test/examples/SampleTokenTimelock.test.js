import latestTime from '../helpers/latestTime';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import { advanceBlock } from '../helpers/advanceToBlock';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SampleTokenTimelock = artifacts.require('SampleTokenTimelock');

const SampleTokenTimelockToken = artifacts.require('SampleTokenTimelockToken');

contract('SampleTokenTimelock', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(100);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.token = await SampleTokenTimelockToken.new({ from: owner });
    this.releaseTime = latestTime() + duration.years(1);
    this.timelock = await SampleTokenTimelock.new(this.token.address, beneficiary, this.releaseTime);
    await this.token.mint(this.timelock.address, amount, { from: owner });
  });

  it('should load params correctly', async function () {
    await this.timelock.should.exist;

    const beneficiery_ = await this.timelock.beneficiary();

    const releaseTime_ = await this.timelock.releaseTime();

    const token_ = await this.timelock.token();

    beneficiery_.should.be.equal(beneficiary);

    releaseTime_.should.be.bignumber.equal(new BigNumber(this.releaseTime));
    token_.should.be.equal(this.token.address);
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

  it('cannot be released before time limit', async function () {
    await this.timelock.release().should.be.rejected;
  });
});
