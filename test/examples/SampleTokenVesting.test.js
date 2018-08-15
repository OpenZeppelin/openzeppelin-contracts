import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const SampleTokenVesting = artifacts.require('SampleTokenVesting');

contract('SampleTokenVesting', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(1000);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.years(1);
    this.contractDuration = duration.years(2);
    this.token = await MintableToken.new({ from: owner });

    this.vesting = await SampleTokenVesting.new(
      beneficiary, this.startTime, this.cliff, this.contractDuration, true, { from: owner },
    );

    await this.token.mint(this.vesting.address, amount, { from: owner }).should.be.fulfilled;
  });

  it('should create SampleTokenVesting with correct parameters', async function () {
    await this.token.should.exist;
    await this.vesting.should.exist;

    const beneficiery_ = await this.vesting.beneficiary();

    const revokable_ = await this.vesting.revocable();

    const cliff_ = await this.vesting.cliff();
    const duration_ = await this.vesting.duration();

    const start_ = await this.vesting.start();
    start_.should.be.bignumber.equal(this.startTime);

    revokable_.should.be.equal(true);

    cliff_.should.be.bignumber.equal(new BigNumber(this.cliff).add(this.startTime));

    duration_.should.be.bignumber.equal(this.contractDuration);

    beneficiery_.should.be.equal(beneficiary);
  });

  it('cannot be released before this.cliff', async function () {
    await this.vesting.release(this.token.address).should.be.rejectedWith(EVMRevert);
  });

  it('cannot be released just prior this.cliff', async function () {
    await increaseTimeTo(this.startTime + this.cliff - duration.seconds(3));
    await this.vesting.release(this.token.address).should.be.rejectedWith(EVMRevert);
  });

  it('can be released just after this.cliff', async function () {
    await increaseTimeTo(this.startTime + this.cliff + duration.seconds(3));
    await this.vesting.release(this.token.address).should.be.fulfilled;
  });

  it('can be released after this.cliff', async function () {
    await increaseTimeTo(this.startTime + this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address).should.be.fulfilled;
  });

  it('should release proper amount after this.cliff', async function () {
    await increaseTimeTo(this.startTime + this.cliff);

    const { receipt } = await this.vesting.release(this.token.address);
    const releaseTime = web3.eth.getBlock(receipt.blockNumber).timestamp;

    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount.mul(releaseTime - this.startTime).div(this.contractDuration).floor());
  });

  it('should linearly release tokens during vesting period', async function () {
    const vestingPeriod = this.contractDuration - this.cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = this.startTime + this.cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      await this.vesting.release(this.token.address);
      const balance = await this.token.balanceOf(beneficiary);
      const expectedVesting = amount.mul(now - this.startTime).div(this.contractDuration).floor();

      balance.should.bignumber.equal(expectedVesting);
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.startTime + this.contractDuration);
    await this.vesting.release(this.token.address);
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount);
  });

  it('should be revoked by owner if revocable is set', async function () {
    await this.vesting.revoke(this.token.address, { from: owner }).should.be.fulfilled;
  });

  it('should fail to be revoked by owner if revocable not set', async function () {
    const vesting = await SampleTokenVesting.new(
      beneficiary, this.startTime, this.cliff, this.contractDuration, false, { from: owner },
    );
    await vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
  });

  it('should return the non-vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.startTime + this.cliff + duration.weeks(12));

    const vested = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const ownerBalance = await this.token.balanceOf(owner);
    ownerBalance.should.bignumber.equal(amount - vested);
  });

  it('should keep the vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.startTime + this.cliff + duration.weeks(12));

    const vestedPre = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const vestedPost = await this.vesting.vestedAmount(this.token.address);

    vestedPre.should.bignumber.equal(vestedPost);
  });

  it('should fail to be revoked a second time', async function () {
    await increaseTimeTo(this.startTime + this.cliff + duration.weeks(12));

    await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner }).should.be.fulfilled;

    await this.vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
  });
});
