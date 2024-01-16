const { expect } = require('chai');
const time = require('../helpers/time');

function shouldBehaveLikeVesting() {
  it('check vesting schedule', async function () {
    for (const timestamp of this.schedule) {
      await time.increaseTo.timestamp(timestamp);
      const vesting = this.vestingFn(timestamp);

      expect(await this.mock.vestedAmount(...this.args, timestamp)).to.equal(vesting);
      expect(await this.mock.releasable(...this.args)).to.equal(vesting);
    }
  });

  it('execute vesting schedule', async function () {
    let released = 0n;
    {
      const tx = await this.mock.release(...this.args);
      await expect(tx)
        .to.emit(this.mock, this.releasedEvent)
        .withArgs(...this.argsVerify, 0);

      await this.checkRelease(tx, 0n);
    }

    for (const timestamp of this.schedule) {
      await time.increaseTo.timestamp(timestamp, false);
      const vested = this.vestingFn(timestamp);

      const tx = await this.mock.release(...this.args);
      await expect(tx).to.emit(this.mock, this.releasedEvent);

      await this.checkRelease(tx, vested - released);
      released = vested;
    }
  });

  it('should revert on transaction failure', async function () {
    const { args, error } = await this.setupFailure();

    for (const timestamp of this.schedule) {
      await time.increaseTo.timestamp(timestamp);

      await expect(this.mock.release(...args)).to.be.revertedWithCustomError(...error);
    }
  });
}

module.exports = {
  shouldBehaveLikeVesting,
};
