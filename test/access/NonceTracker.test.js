
import assertRevert from '../helpers/assertRevert';

const NonceTracker = artifacts.require('NonceTrackerImpl');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('NonceTracker', ([_, owner, anyone, another]) => {
  context('canDoThisOnce', function () {
    before(async function () {
      this.tracker = await NonceTracker.new({ from: owner });
    });

    it('should allow anyone to do thing once', async function () {
      await this.tracker.canDoThisOnce({ from: anyone });
    });

    it('should revert if they try to do it again', async function () {
      await assertRevert(
        this.tracker.canDoThisOnce({ from: anyone })
      );
    });

    it('should allow another person to do it once anyway', async function () {
      await this.tracker.canDoThisOnce({ from: another });
    });
  });

  context('canDoThisTwice', function () {
    before(async function () {
      this.tracker = await NonceTracker.new({ from: owner });
    });

    it('should allow a person to do things twice', async function () {
      await this.tracker.canDoThisTwice({ from: anyone });
      await this.tracker.canDoThisTwice({ from: anyone });
      await assertRevert(
        this.tracker.canDoThisTwice({ from: anyone })
      );
    });
  });

  context('cantDoThisAtAll', function () {
    before(async function () {
      this.tracker = await NonceTracker.new({ from: owner });
    });

    it('should not allow anyone', async function () {
      await assertRevert(
        this.tracker.cantDoThisAtAll({ from: anyone })
      );
    });
  });

  context('withAcceptedNonce', function () {
    before(async function () {
      this.tracker = await NonceTracker.new({ from: owner });
    });

    it('should allow inputs', async function () {
      await this.tracker.withAcceptedNonce(1, { from: anyone });
    });
  });
});
