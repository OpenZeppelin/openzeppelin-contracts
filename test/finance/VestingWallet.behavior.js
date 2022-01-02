const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function releasedEvent (token, amount) {
  return token
    ? [ 'ERC20Released', { token: token.address, amount } ]
    : [ 'EtherReleased', { amount } ];
}

function shouldBehaveLikeVesting (beneficiary) {
  it('check vesting schedule', async function () {
    const [ method, ...args ] = this.token
      ? [ 'vestedAmount(address,uint64)', this.token.address ]
      : [ 'vestedAmount(uint64)' ];

    for (const timestamp of this.schedule) {
      expect(await this.mock.methods[method](...args, timestamp))
        .to.be.bignumber.equal(this.vestingFn(timestamp));
    }
  });

  it('execute vesting schedule', async function () {
    const [ method, ...args ] = this.token
      ? [ 'release(address)', this.token.address ]
      : [ 'release()' ];

    let released = web3.utils.toBN(0);
    const before = await this.getBalance(beneficiary);

    {
      const receipt = await this.mock.methods[method](...args);

      await expectEvent.inTransaction(
        receipt.tx,
        this.mock,
        ...releasedEvent(this.token, '0'),
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

      const receipt = await this.mock.methods[method](...args);

      await expectEvent.inTransaction(
        receipt.tx,
        this.mock,
        ...releasedEvent(this.token, vested.sub(released)),
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
