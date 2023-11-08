const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

function releasedEvent(token) {
  return token ? 'ERC20Released' : 'EtherReleased';
}

function shouldBehaveLikeVesting() {
  it('check vesting schedule', async function () {
    const args = this.token ? [this.token.address] : [];

    for (const timestamp of this.schedule) {
      await time.increaseTo(timestamp);
      const vesting = this.vestingFn(timestamp);

      expect(await this.mock.vestedAmount(...args, timestamp)).to.be.equal(vesting);
      expect(await this.mock.releasable(...args)).to.be.equal(vesting);
    }
  });

  it('execute vesting schedule', async function () {
    const args = this.token ? [this.token.address] : [];

    let released = 0n;
    const before = await this.getBalance(this.beneficiary);

    {
      const tx = await this.mock.release(...args);
      await expect(tx)
        .to.emit(this.mock, releasedEvent(this.token))
        .withArgs(...args, 0);

      await this.checkRelease(tx, 0n);
    }

    for (const timestamp of this.schedule) {
      await time.setNextBlockTimestamp(timestamp);
      const vested = this.vestingFn(timestamp);

      const tx = await this.mock.release(...args);
      await expect(tx)
        .to.emit(this.mock, releasedEvent(this.token))

      await this.checkRelease(tx, vested - released);
      released = vested;
    }
  });

  it('Rejects execution if transaction fails')
}

module.exports = {
  shouldBehaveLikeVesting,
};
