const { time, setNextBlockBaseFeePerGas } = require('@nomicfoundation/hardhat-network-helpers');
const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { web3 } = require('hardhat');
const { expectRevertCustomError } = require('../helpers/customError');

function releasedEvent(token, amount) {
  return token ? ['ERC20Released', { token: token.address, amount }] : ['EtherReleased', { amount }];
}

function shouldBehaveLikeVesting(beneficiary, accounts) {
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

  describe('execute vesting schedule', async function () {
    beforeEach(async function () {
      [this.release, ...this.args] = this.token ? ['release(address)', this.token.address] : ['release()'];
    });

    it('releases a linearly vested schedule', async function () {
      let released = web3.utils.toBN(0);
      const before = await this.getBalance(beneficiary);
      const releaser = await this.mock.owner();

      {
        // Allows gas price to be 0 so no ETH is spent in the transaction.
        await setNextBlockBaseFeePerGas(0);

        const receipt = await this.mock.methods[this.release](...this.args, { from: releaser, gasPrice: 0 });
        await expectEvent.inTransaction(receipt.tx, this.mock, ...releasedEvent(this.token, '0'));
        await this.checkRelease(receipt, beneficiary, '0');

        expect(await this.getBalance(beneficiary)).to.be.bignumber.equal(before);
      }

      for (const timestamp of this.schedule) {
        await time.setNextBlockTimestamp(timestamp);
        const vested = this.vestingFn(timestamp);

        // Allows gas price to be 0 so no ETH is spent in the transaction.
        await setNextBlockBaseFeePerGas(0);

        const receipt = await this.mock.methods[this.release](...this.args, { from: releaser, gasPrice: 0 });
        await expectEvent.inTransaction(receipt.tx, this.mock, ...releasedEvent(this.token, vested.sub(released)));
        await this.checkRelease(receipt, beneficiary, vested.sub(released));

        expect(await this.getBalance(beneficiary)).to.be.bignumber.equal(before.add(vested));

        released = vested;
      }
    });

    it('cannot be released by a non releaser', async function () {
      await expectRevertCustomError(
        this.mock.methods[this.release](...this.args, { from: accounts[0] }),
        'OwnableUnauthorizedAccount',
        [accounts[0]],
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeVesting,
};
