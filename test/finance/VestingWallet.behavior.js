const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function shouldBehaveLikeVesting (beneficiary) {
  it('check vesting schedule', async function () {
    const args = this.token ? [ this.token.address ] : [];

    for (const timestamp of this.schedule) {
      expect(await this.mock.vestedAmount(...args, timestamp))
        .to.be.bignumber.equal(this.vestingFn(timestamp));
    }
  });

  it('execute vesting schedule', async function () {
    const args = this.token ? [ this.token.address ] : [];

    let released = web3.utils.toBN(0);
    const before = await this.getBalance(beneficiary);

    {
      const receipt = await this.mock.release(...args);

      await expectEvent.inTransaction(
        receipt.tx,
        this.mock,
        this.token ? 'ERC20Released' : 'EtherReleased',
        Object.fromEntries(Object.entries({
          token: this.token && this.token.address,
          amount: '0',
        }).filter(x => x.every(Boolean))),
      );

      await this.checkRelease(receipt, beneficiary, '0');

      expect(await this.getBalance(beneficiary)).to.be.bignumber.equal(before);
    }

    for (const timestamp of this.schedule) {
      const vested = this.vestingFn(timestamp);

      await new Promise(resolve => web3.currentProvider.send({
        method: 'evm_setNextBlockTimestamp',
        params: [ timestamp.toNumber() ],
      }, resolve));

      const receipt = await this.mock.release(...args);

      await expectEvent.inTransaction(
        receipt.tx,
        this.mock,
        this.token ? 'ERC20Released' : 'EtherReleased',
        Object.fromEntries(Object.entries({
          token: this.token && this.token.address,
          amount: vested.sub(released),
        }).filter(x => x.every(Boolean))),
      );

      await this.checkRelease(receipt, beneficiary, vested.sub(released));

      expect(await this.getBalance(beneficiary))
        .to.be.bignumber.equal(before.add(vested));

      released = vested;
    }
  });
}

module.exports = {
  shouldBehaveLikeVesting,
};
