const { expectThrow } = require('../../helpers/expectThrow');
const { EVMRevert } = require('../../helpers/EVMRevert');
const { latestTime } = require('../../helpers/latestTime');
const { increaseTimeTo, duration } = require('../../helpers/increaseTime');
const { ethGetBlock } = require('../../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const TokenVesting = artifacts.require('TokenVesting');

contract('TokenVesting', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(1000);

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });

    this.start = (await latestTime()) + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.years(1);
    this.duration = duration.years(2);

    this.vesting = await TokenVesting.new(beneficiary, this.start, this.cliff, this.duration, true, { from: owner });

    await this.token.mint(this.vesting.address, amount, { from: owner });
  });

  it('cannot be released before cliff', async function () {
    await expectThrow(
      this.vesting.release(this.token.address),
      EVMRevert,
    );
  });

  it('can be released after cliff', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address);
  });

  it('should release proper amount after cliff', async function () {
    await increaseTimeTo(this.start + this.cliff);

    const { receipt } = await this.vesting.release(this.token.address);
    const block = await ethGetBlock(receipt.blockNumber);
    const releaseTime = block.timestamp;

    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount.mul(releaseTime - this.start).div(this.duration).floor());
  });

  it('should linearly release tokens during vesting period', async function () {
    const vestingPeriod = this.duration - this.cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = this.start + this.cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      await this.vesting.release(this.token.address);
      const balance = await this.token.balanceOf(beneficiary);
      const expectedVesting = amount.mul(now - this.start).div(this.duration).floor();

      balance.should.bignumber.equal(expectedVesting);
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.start + this.duration);
    await this.vesting.release(this.token.address);
    const balance = await this.token.balanceOf(beneficiary);
    balance.should.bignumber.equal(amount);
  });

  it('should be revoked by owner if revocable is set', async function () {
    await this.vesting.revoke(this.token.address, { from: owner });
  });

  it('should fail to be revoked by owner if revocable not set', async function () {
    const vesting = await TokenVesting.new(beneficiary, this.start, this.cliff, this.duration, false, { from: owner });
    await expectThrow(
      vesting.revoke(this.token.address, { from: owner }),
      EVMRevert,
    );
  });

  it('should return the non-vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

    const vested = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const ownerBalance = await this.token.balanceOf(owner);
    ownerBalance.should.bignumber.equal(amount.sub(vested));
  });

  it('should keep the vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

    const vestedPre = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const vestedPost = await this.vesting.vestedAmount(this.token.address);

    vestedPre.should.bignumber.equal(vestedPost);
  });

  it('should fail to be revoked a second time', async function () {
    await increaseTimeTo(this.start + this.cliff + duration.weeks(12));

    await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    await expectThrow(
      this.vesting.revoke(this.token.address, { from: owner }),
      EVMRevert,
    );
  });
});
