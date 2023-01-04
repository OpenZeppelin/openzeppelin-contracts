const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function releasedEvent(token, amount) {
  return token ? ['ERC20Released', { token: token.address, amount }] : ['EtherReleased', { amount }];
}

function shouldBehaveLikeVesting(beneficiary) {
  it('check vesting schedule', async function () {
    const [vestedAmount, releasable, ...args] = this.token
      ? ['vestedAmount(address,uint64)', 'releasable(address)', this.token.address]
      : ['vestedAmount(uint64)', 'releasable()'];

    for (const timestamp of this.schedule) {
      await time.increaseTo(timestamp);
      const vesting = this.vestingFn(timestamp);

      expect(await this.mock.methods[vestedAmount](...args, timestamp)).to.be.bignumber.equal(vesting);

      expect(await this.mock.methods[releasable](...args)).to.be.bignumber.equal(vesting);
    }
  });

  it('execute vesting schedule', async function () {
    const [release, ...args] = this.token ? ['release(address)', this.token.address] : ['release()'];

    let released = web3.utils.toBN(0);
    const before = await this.getBalance(beneficiary);

    {
      const receipt = await this.mock.methods[release](...args);

      await expectEvent.inTransaction(receipt.tx, this.mock, ...releasedEvent(this.token, '0'));

      await this.checkRelease(receipt, beneficiary, '0');

      expect(await this.getBalance(beneficiary)).to.be.bignumber.equal(before);
    }

    for (const timestamp of this.schedule) {
      await time.setNextBlockTimestamp(timestamp);
      const vested = this.vestingFn(timestamp);

      const receipt = await this.mock.methods[release](...args);
      await expectEvent.inTransaction(receipt.tx, this.mock, ...releasedEvent(this.token, vested.sub(released)));

      await this.checkRelease(receipt, beneficiary, vested.sub(released));

      expect(await this.getBalance(beneficiary)).to.be.bignumber.equal(before.add(vested));

      released = vested;
    }
  });
}

module.exports = {
  shouldBehaveLikeVesting,
};
