const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');

const { CALL_TYPE_BATCH, encodeMode, encodeBatch } = require('../../helpers/erc7579');

function shouldBehaveLikeERC7821({ deployable = true } = {}) {
  describe('supports ERC-7821', function () {
    beforeEach(async function () {
      // give eth to the account (before deployment)
      await this.other.sendTransaction({ to: this.mock.target, value: ethers.parseEther('1') });

      // account is not initially deployed
      await expect(ethers.provider.getCode(this.mock)).to.eventually.equal('0x');

      this.encodeUserOpCalldata = (...calls) =>
        this.mock.interface.encodeFunctionData('execute', [
          encodeMode({ callType: CALL_TYPE_BATCH }),
          encodeBatch(...calls),
        ]);
    });

    it('should revert if the caller is not the canonical entrypoint or the account itself', async function () {
      await this.mock.deploy();

      await expect(
        this.mock.connect(this.other).execute(
          encodeMode({ callType: CALL_TYPE_BATCH }),
          encodeBatch({
            target: this.target,
            data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
          }),
        ),
      )
        .to.be.revertedWithCustomError(this.mock, 'AccountUnauthorized')
        .withArgs(this.other);
    });

    if (deployable) {
      describe('when not deployed', function () {
        it('should be created with handleOps and increase nonce', async function () {
          const operation = await this.mock
            .createUserOp({
              callData: this.encodeUserOpCalldata({
                target: this.target,
                value: 17,
                data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
              }),
            })
            .then(op => op.addInitCode())
            .then(op => this.signUserOp(op));

          // Can't call the account to get its nonce before it's deployed
          await expect(predeploy.entrypoint.v08.getNonce(this.mock.target, 0)).to.eventually.equal(0);
          await expect(predeploy.entrypoint.v08.handleOps([operation.packed], this.beneficiary))
            .to.emit(predeploy.entrypoint.v08, 'AccountDeployed')
            .withArgs(operation.hash(), this.mock, this.helper.factory, ethers.ZeroAddress)
            .to.emit(this.target, 'MockFunctionCalledExtra')
            .withArgs(this.mock, 17);
          await expect(this.mock.getNonce()).to.eventually.equal(1);
        });

        it('should revert if the signature is invalid', async function () {
          const operation = await this.mock
            .createUserOp({
              callData: this.encodeUserOpCalldata({
                target: this.target,
                value: 17,
                data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
              }),
            })
            .then(op => op.addInitCode());

          operation.signature = '0x00';

          await expect(predeploy.entrypoint.v08.handleOps([operation.packed], this.beneficiary)).to.be.reverted;
        });
      });
    }

    describe('when deployed', function () {
      beforeEach(async function () {
        await this.mock.deploy();
      });

      it('should increase nonce and call target', async function () {
        const operation = await this.mock
          .createUserOp({
            callData: this.encodeUserOpCalldata({
              target: this.target,
              value: 42,
              data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
            }),
          })
          .then(op => this.signUserOp(op));

        await expect(this.mock.getNonce()).to.eventually.equal(0);
        await expect(predeploy.entrypoint.v08.handleOps([operation.packed], this.beneficiary))
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.mock, 42);
        await expect(this.mock.getNonce()).to.eventually.equal(1);
      });

      it('should support sending eth to an EOA', async function () {
        const operation = await this.mock
          .createUserOp({ callData: this.encodeUserOpCalldata({ target: this.other, value: 42 }) })
          .then(op => this.signUserOp(op));

        await expect(this.mock.getNonce()).to.eventually.equal(0);
        await expect(predeploy.entrypoint.v08.handleOps([operation.packed], this.beneficiary)).to.changeEtherBalance(
          this.other,
          42,
        );
        await expect(this.mock.getNonce()).to.eventually.equal(1);
      });

      it('should support batch execution', async function () {
        const value1 = 43374337n;
        const value2 = 69420n;

        const operation = await this.mock
          .createUserOp({
            callData: this.encodeUserOpCalldata(
              { target: this.other, value: value1 },
              {
                target: this.target,
                value: value2,
                data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
              },
            ),
          })
          .then(op => this.signUserOp(op));

        await expect(this.mock.getNonce()).to.eventually.equal(0);
        const tx = predeploy.entrypoint.v08.handleOps([operation.packed], this.beneficiary);
        await expect(tx).to.changeEtherBalances([this.other, this.target], [value1, value2]);
        await expect(tx).to.emit(this.target, 'MockFunctionCalledExtra').withArgs(this.mock, value2);
        await expect(this.mock.getNonce()).to.eventually.equal(1);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC7821,
};
