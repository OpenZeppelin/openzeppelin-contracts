const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');

const { encodeBatch, encodeMode, CALL_TYPE_BATCH } = require('../../helpers/erc7579');
const { MAX_UINT48 } = require('../../helpers/constants');
const time = require('../../helpers/time');

const deposit = ethers.parseEther('1');
const value = 42n;
const delay = time.duration.hours(10);

function shouldBehaveLikePaymaster({ postOp, timeRange }) {
  describe('entryPoint', function () {
    it('should return the canonical entrypoint', async function () {
      await expect(this.paymaster.entryPoint()).to.eventually.equal(predeploy.entrypoint.v09);
    });
  });

  describe('validatePaymasterUserOp', function () {
    beforeEach(async function () {
      await this.paymaster.deposit({ value: deposit });

      this.userOp ??= {};
      this.userOp.paymaster = this.paymaster;
    });

    describe('validation (signature/token ownership/allowance)', function () {
      it('approved user operation are sponsored', async function () {
        const signedUserOp = await this.account
          .createUserOp({
            ...this.userOp,
            callData: this.account.interface.encodeFunctionData('execute', [
              encodeMode({ callType: CALL_TYPE_BATCH }),
              encodeBatch({
                target: this.target,
                data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
              }),
            ]),
          })
          .then(op => this.paymasterSignUserOp(op))
          .then(op => this.signUserOp(op));

        // before
        await expect(predeploy.entrypoint.v09.getNonce(this.account, 0n)).to.eventually.equal(0n);
        await expect(predeploy.entrypoint.v09.balanceOf(this.paymaster)).to.eventually.equal(deposit);

        // execute sponsored user operation
        const handleOpsTx = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);
        await expect(handleOpsTx).to.changeEtherBalance(this.account, 0n); // no balance change
        await expect(handleOpsTx).to.emit(this.target, 'MockFunctionCalledExtra').withArgs(this.account, 0n);

        if (postOp)
          await expect(handleOpsTx).to.emit(this.paymaster, 'PaymasterDataPostOp').withArgs(signedUserOp.callData);

        // after
        await expect(predeploy.entrypoint.v09.getNonce(this.account, 0n)).to.eventually.equal(1n);
        await expect(predeploy.entrypoint.v09.balanceOf(this.paymaster)).to.eventually.be.lessThan(deposit);
      });

      it('revert if missing paymaster validation', async function () {
        const signedUserOp = await this.account
          .createUserOp({
            ...this.userOp,
            callData: this.account.interface.encodeFunctionData('execute', [
              encodeMode({ callType: CALL_TYPE_BATCH }),
              encodeBatch({
                target: this.target,
                data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
              }),
            ]),
          })
          .then(op => this.paymasterSignUserOpInvalid(op, 0n, 0n))
          .then(op => this.signUserOp(op));

        await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
          .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
          .withArgs(0n, 'AA34 signature error');
      });
    });

    timeRange &&
      describe('time range', function () {
        it('revert if validation data is too early', async function () {
          const signedUserOp = await this.account
            .createUserOp({
              ...this.userOp,
              callData: this.account.interface.encodeFunctionData('execute', [
                encodeMode({ callType: CALL_TYPE_BATCH }),
                encodeBatch({
                  target: this.target,
                  data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
                }),
              ]),
            })
            .then(op =>
              this.paymasterSignUserOp(op, {
                // validAfter MAX_UINT48 is in the future
                // shr by 1 to remove the most significant bit, indicating timestamp ranges
                validAfter: MAX_UINT48 >> 1n,
              }),
            )
            .then(op => this.signUserOp(op));

          await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
            .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
            .withArgs(0n, 'AA32 paymaster expired or not due');
        });

        it('revert if validation data is too late', async function () {
          const signedUserOp = await this.account
            .createUserOp({
              ...this.userOp,
              callData: this.account.interface.encodeFunctionData('execute', [
                encodeMode({ callType: CALL_TYPE_BATCH }),
                encodeBatch({
                  target: this.target,
                  data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
                }),
              ]),
            })
            .then(op => this.paymasterSignUserOp(op, { validUntil: 1n })) // validUntil 1n is in the past
            .then(op => this.signUserOp(op));

          await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
            .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
            .withArgs(0n, 'AA32 paymaster expired or not due');
        });
      });

    it('reverts if the caller is not the entrypoint', async function () {
      const operation = await this.account.createUserOp(this.userOp);

      await expect(
        this.paymaster.connect(this.other).validatePaymasterUserOp(operation.packed, ethers.ZeroHash, 100_000n),
      )
        .to.be.revertedWithCustomError(this.paymaster, 'PaymasterUnauthorized')
        .withArgs(this.other);
    });
  });

  describe('postOp', function () {
    it('reverts if the caller is not the entrypoint', async function () {
      await expect(this.paymaster.connect(this.other).postOp(0n, '0x', 0n, 0n))
        .to.be.revertedWithCustomError(this.paymaster, 'PaymasterUnauthorized')
        .withArgs(this.other);
    });
  });

  describe('deposit lifecycle', function () {
    it('deposits and withdraws effectively', async function () {
      await expect(predeploy.entrypoint.v09.balanceOf(this.paymaster)).to.eventually.equal(0n);

      await expect(this.paymaster.connect(this.other).deposit({ value })).to.changeEtherBalances(
        [this.other, predeploy.entrypoint.v09],
        [-value, value],
      );

      await expect(predeploy.entrypoint.v09.balanceOf(this.paymaster)).to.eventually.equal(value);

      await expect(this.paymaster.connect(this.admin).withdraw(this.receiver, 1n)).to.changeEtherBalances(
        [predeploy.entrypoint.v09, this.receiver],
        [-1n, 1n],
      );

      await expect(predeploy.entrypoint.v09.balanceOf(this.paymaster)).to.eventually.equal(value - 1n);
    });

    it('reverts when an unauthorized caller tries to withdraw', async function () {
      await this.paymaster.deposit({ value });

      await expect(this.paymaster.connect(this.other).withdraw(this.receiver, value)).to.be.reverted;
    });
  });

  describe('stake lifecycle', function () {
    it('adds and removes stake effectively', async function () {
      await expect(predeploy.entrypoint.v09.getDepositInfo(this.paymaster)).to.eventually.deep.equal([
        0n,
        false,
        0n,
        0n,
        0n,
      ]);

      // stake
      await expect(this.paymaster.connect(this.other).addStake(delay, { value })).to.changeEtherBalances(
        [this.other, predeploy.entrypoint.v09],
        [-value, value],
      );

      await expect(predeploy.entrypoint.v09.getDepositInfo(this.paymaster)).to.eventually.deep.equal([
        0n,
        true,
        42n,
        delay,
        0n,
      ]);

      // unlock
      const unlockTx = this.paymaster.connect(this.admin).unlockStake();

      const timestamp = await time.clockFromReceipt.timestamp(unlockTx);
      await expect(predeploy.entrypoint.v09.getDepositInfo(this.paymaster)).to.eventually.deep.equal([
        0n,
        false,
        42n,
        delay,
        timestamp + delay,
      ]);

      await time.increaseBy.timestamp(delay);

      // withdraw stake
      await expect(this.paymaster.connect(this.admin).withdrawStake(this.receiver)).to.changeEtherBalances(
        [predeploy.entrypoint.v09, this.receiver],
        [-value, value],
      );

      await expect(predeploy.entrypoint.v09.getDepositInfo(this.paymaster)).to.eventually.deep.equal([
        0n,
        false,
        0n,
        0n,
        0n,
      ]);
    });

    it('reverts when an unauthorized caller tries to unlock stake', async function () {
      await this.paymaster.addStake(delay, { value });

      await expect(this.paymaster.connect(this.other).unlockStake()).to.be.reverted;
    });

    it('reverts when an unauthorized caller tries to withdraw stake', async function () {
      await this.paymaster.addStake(delay, { value });
      await this.paymaster.connect(this.admin).unlockStake();
      await time.increaseBy.timestamp(delay);

      await expect(this.paymaster.connect(this.other).withdrawStake(this.receiver)).to.be.reverted;
    });
  });
}

module.exports = {
  shouldBehaveLikePaymaster,
};
