const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');
const time = require('../helpers/time');
const { ethGetBlock } = require('../helpers/web3');
const { ZERO_ADDRESS } = require('../helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20Mintable = artifacts.require('ERC20Mintable');
const TokenVesting = artifacts.require('TokenVesting');

contract('TokenVesting', function ([_, owner, beneficiary]) {
  const amount = new BigNumber(1000);

  beforeEach(async function () {
    // +1 minute so it starts after contract instantiation
    this.start = (await time.latest()) + time.duration.minutes(1);
    this.cliffDuration = time.duration.years(1);
    this.duration = time.duration.years(2);
  });

  it('reverts with a duration shorter than the cliff', async function () {
    const cliffDuration = this.duration;
    const duration = this.cliffDuration;

    cliffDuration.should.be.gt(duration);

    await shouldFail.reverting(
      TokenVesting.new(beneficiary, this.start, cliffDuration, duration, true, { from: owner })
    );
  });

  it('reverts with a null beneficiary', async function () {
    await shouldFail.reverting(
      TokenVesting.new(ZERO_ADDRESS, this.start, this.cliffDuration, this.duration, true, { from: owner })
    );
  });

  it('reverts with a null duration', async function () {
    // cliffDuration should also be 0, since the duration must be larger than the cliff
    await shouldFail.reverting(
      TokenVesting.new(beneficiary, this.start, 0, 0, true, { from: owner })
    );
  });

  it('reverts if the end time is in the past', async function () {
    const now = await time.latest();

    this.start = now - this.duration - time.duration.minutes(1);
    await shouldFail.reverting(
      TokenVesting.new(beneficiary, this.start, this.cliffDuration, this.duration, true, { from: owner })
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.vesting = await TokenVesting.new(
        beneficiary, this.start, this.cliffDuration, this.duration, true, { from: owner });

      this.token = await ERC20Mintable.new({ from: owner });
      await this.token.mint(this.vesting.address, amount, { from: owner });
    });

    it('can get state', async function () {
      (await this.vesting.beneficiary()).should.be.equal(beneficiary);
      (await this.vesting.cliff()).should.be.bignumber.equal(this.start + this.cliffDuration);
      (await this.vesting.start()).should.be.bignumber.equal(this.start);
      (await this.vesting.duration()).should.be.bignumber.equal(this.duration);
      (await this.vesting.revocable()).should.be.equal(true);
    });

    it('cannot be released before cliff', async function () {
      await shouldFail.reverting(this.vesting.release(this.token.address));
    });

    it('can be released after cliff', async function () {
      await time.increaseTo(this.start + this.cliffDuration + time.duration.weeks(1));
      const { logs } = await this.vesting.release(this.token.address);
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        amount: await this.token.balanceOf(beneficiary),
      });
    });

    it('should release proper amount after cliff', async function () {
      await time.increaseTo(this.start + this.cliffDuration);

      const { receipt } = await this.vesting.release(this.token.address);
      const block = await ethGetBlock(receipt.blockNumber);
      const releaseTime = block.timestamp;

      const releasedAmount = amount.mul(releaseTime - this.start).div(this.duration).floor();
      (await this.token.balanceOf(beneficiary)).should.bignumber.equal(releasedAmount);
      (await this.vesting.released(this.token.address)).should.bignumber.equal(releasedAmount);
    });

    it('should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.duration - this.cliffDuration;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start + this.cliffDuration + i * (vestingPeriod / checkpoints);
        await time.increaseTo(now);

        await this.vesting.release(this.token.address);
        const expectedVesting = amount.mul(now - this.start).div(this.duration).floor();
        (await this.token.balanceOf(beneficiary)).should.bignumber.equal(expectedVesting);
        (await this.vesting.released(this.token.address)).should.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await time.increaseTo(this.start + this.duration);
      await this.vesting.release(this.token.address);
      (await this.token.balanceOf(beneficiary)).should.bignumber.equal(amount);
      (await this.vesting.released(this.token.address)).should.bignumber.equal(amount);
    });

    it('should be revoked by owner if revocable is set', async function () {
      const { logs } = await this.vesting.revoke(this.token.address, { from: owner });
      expectEvent.inLogs(logs, 'TokenVestingRevoked', { token: this.token.address });
      (await this.vesting.revoked(this.token.address)).should.equal(true);
    });

    it('should fail to be revoked by owner if revocable not set', async function () {
      const vesting = await TokenVesting.new(
        beneficiary, this.start, this.cliffDuration, this.duration, false, { from: owner }
      );

      await shouldFail.reverting(vesting.revoke(this.token.address, { from: owner }));
    });

    it('should return the non-vested tokens when revoked by owner', async function () {
      await time.increaseTo(this.start + this.cliffDuration + time.duration.weeks(12));

      const vested = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      await this.vesting.revoke(this.token.address, { from: owner });

      (await this.token.balanceOf(owner)).should.bignumber.equal(amount.sub(vested));
    });

    it('should keep the vested tokens when revoked by owner', async function () {
      await time.increaseTo(this.start + this.cliffDuration + time.duration.weeks(12));

      const vestedPre = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      await this.vesting.revoke(this.token.address, { from: owner });

      const vestedPost = vestedAmount(amount, await time.latest(), this.start, this.cliffDuration, this.duration);

      vestedPre.should.bignumber.equal(vestedPost);
    });

    it('should fail to be revoked a second time', async function () {
      await this.vesting.revoke(this.token.address, { from: owner });
      await shouldFail.reverting(this.vesting.revoke(this.token.address, { from: owner }));
    });

    function vestedAmount (total, now, start, cliffDuration, duration) {
      return (now < start + cliffDuration) ? 0 : Math.round(total * (now - start) / duration);
    }
  });
});
