const { ethers } = require('hardhat');
const { expect } = require('chai');
const { impersonate } = require('../helpers/account');
const { SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILURE } = require('../helpers/erc4337');
const { setBalance } = require('@nomicfoundation/hardhat-network-helpers');

function shouldBehaveLikeAnAccount() {
  describe('entryPoint', function () {
    it('should return the canonical entrypoint', async function () {
      await this.smartAccount.deploy();
      expect(await this.smartAccount.entryPoint()).to.equal(this.entrypoint.target);
    });
  });

  describe('validateUserOp', function () {
    beforeEach(async function () {
      await setBalance(this.smartAccount.target, ethers.parseEther('1'));
      await this.smartAccount.deploy();
    });

    it('should revert if the caller is not the canonical entrypoint', async function () {
      const selector = this.smartAccount.interface.getFunction('executeUserOp').selector;
      const operation = await this.smartAccount
        .createOp({
          callData: ethers.concat([
            selector,
            ethers.AbiCoder.defaultAbiCoder().encode(
              ['address', 'uint256', 'bytes'],
              [this.target.target, 0, this.target.interface.encodeFunctionData('mockFunctionExtra')],
            ),
          ]),
        })
        .then(op => op.sign(this.signer));

      await expect(this.smartAccount.connect(this.other).validateUserOp(operation.packed, operation.hash, 0))
        .to.be.revertedWithCustomError(this.smartAccount, 'AccountUnauthorized')
        .withArgs(this.other);
    });

    describe('when the caller is the canonical entrypoint', function () {
      beforeEach(async function () {
        this.entrypointAsSigner = await impersonate(this.entrypoint.target);
      });

      it('should return SIG_VALIDATION_SUCCESS if the signature is valid', async function () {
        const selector = this.smartAccount.interface.getFunction('executeUserOp').selector;
        const operation = await this.smartAccount
          .createOp({
            callData: ethers.concat([
              selector,
              ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256', 'bytes'],
                [this.target.target, 0, this.target.interface.encodeFunctionData('mockFunctionExtra')],
              ),
            ]),
          })
          .then(op => op.sign(this.signer));

        expect(
          await this.smartAccount
            .connect(this.entrypointAsSigner)
            .validateUserOp.staticCall(operation.packed, operation.hash, 0),
        ).to.eq(SIG_VALIDATION_SUCCESS);
      });

      it('should return SIG_VALIDATION_FAILURE if the signature is invalid', async function () {
        const selector = this.smartAccount.interface.getFunction('executeUserOp').selector;
        const operation = await this.smartAccount.createOp({
          callData: ethers.concat([
            selector,
            ethers.AbiCoder.defaultAbiCoder().encode(
              ['address', 'uint256', 'bytes'],
              [this.target.target, 0, this.target.interface.encodeFunctionData('mockFunctionExtra')],
            ),
          ]),
        });

        operation.signature = '0x00';

        expect(
          await this.smartAccount
            .connect(this.entrypointAsSigner)
            .validateUserOp.staticCall(operation.packed, operation.hash, 0),
        ).to.eq(SIG_VALIDATION_FAILURE);
      });

      it('should pay missing account funds for execution', async function () {
        const selector = this.smartAccount.interface.getFunction('executeUserOp').selector;
        const operation = await this.smartAccount
          .createOp({
            callData: ethers.concat([
              selector,
              ethers.AbiCoder.defaultAbiCoder().encode(
                ['address', 'uint256', 'bytes'],
                [this.target.target, 0, this.target.interface.encodeFunctionData('mockFunctionExtra')],
              ),
            ]),
          })
          .then(op => op.sign(this.signer));

        const prevAccountBalance = await ethers.provider.getBalance(this.smartAccount.target);
        const prevEntrypointBalance = await ethers.provider.getBalance(this.entrypoint.target);
        const amount = ethers.parseEther('0.1');

        const tx = await this.smartAccount
          .connect(this.entrypointAsSigner)
          .validateUserOp(operation.packed, operation.hash, amount);

        const receipt = await tx.wait();
        const callerFees = receipt.gasUsed * tx.gasPrice;

        expect(await ethers.provider.getBalance(this.smartAccount.target)).to.equal(prevAccountBalance - amount);
        expect(await ethers.provider.getBalance(this.entrypoint.target)).to.equal(
          prevEntrypointBalance + amount - callerFees,
        );
      });
    });
  });

  //   describe.only('executeUserOp', function () {
  //     describe('when not deployed', function () {
  //       beforeEach(async function () {
  //         expect(await ethers.provider.getCode(this.smartAccount.address)).to.equal('0x');
  //         expect(await this.smartAccount.getNonce()).to.equal(0);
  //       });

  //       it('should be created with handleOps', async function () {
  //         const operation = await this.smartAccount
  //           .createOp({
  //             callData: this.smartAccount.interface.encodeFunctionData(
  //               'executeUserOp',
  //               ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunctionExtra')]),
  //             ),
  //           })
  //           .then(op => op.addInitCode())
  //           .then(op => op.sign(this.signer));

  //         await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
  //           .to.emit(this.target, 'AccountDeployed')
  //           .withArgs(operation.hash, this.smartAccount, this.factory, ethers.ZeroAddress)
  //           .to.emit(this.target, 'MockFunctionCalledExtra')
  //           .withArgs(this.smartAccount, 17);
  //       });

  //       it('should revert if the nonce is not 0', async function () {
  //         const operation = await this.smartAccount
  //           .createOp({
  //             callData: this.smartAccount.interface.encodeFunctionData(
  //               'executeUserOp',
  //               ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunction')]),
  //             ),
  //           })
  //           .then(op => op.sign(this.signer));

  //         await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary)).to.be.revertedWith(
  //           'Account: INVALID_NONCE',
  //         );
  //       });

  //       afterEach(async function () {
  //         expect(await ethers.provider.getCode(this.smartAccount.address)).to.not.equal('0x');
  //         expect(await this.smartAccount.getNonce()).to.equal(1);
  //       });
  //     });

  //     describe('when deployed', function () {
  //       beforeEach(async function () {
  //         await this.smartAccount.deploy();
  //       });

  //       it('should increase nonce', async function () {
  //         const operation = await this.smartAccount
  //           .createOp({
  //             callData: this.smartAccount.interface.encodeFunctionData(
  //               'executeUserOp',
  //               ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunction')]),
  //             ),
  //           })
  //           .then(op => op.sign(this.signer));

  //         expect(this.smartAccount.getNonce()).to.equal(0);
  //         await this.entrypoint.handleOps([operation.packed], this.beneficiary);
  //         expect(this.smartAccount.getNonce()).to.equal(1);
  //       });
  //     });

  //     // beforeEach('fund account', async function () {
  //     //   await this.smartAccounts.relayer.sendTransaction({ to: this.smartAccount, value: ethers.parseEther('1') });
  //     // });
  //     // describe('account not deployed yet', function () {
  //     //   it('success: deploy and call', async function () {
  //     //     const operation = await this.smartAccount
  //     //       .createOp({
  //     //         callData: this.smartAccount.interface.encodeFunctionData('execute', [
  //     //           encodeMode(),
  //     //           encodeSingle(this.target, 17, this.target.interface.encodeFunctionData('mockFunctionExtra')),
  //     //         ]),
  //     //       })
  //     //       .then(op => op.addInitCode())
  //     //       .then(op => op.sign(this.signers));
  //     //     await expect(this.entrypoint.handleOps([operation.packed], this.smartAccounts.beneficiary))
  //     //       .to.emit(this.entrypoint, 'AccountDeployed')
  //     //       .withArgs(operation.hash, this.smartAccount, this.factory, ethers.ZeroAddress)
  //     //       .to.emit(this.target, 'MockFunctionCalledExtra')
  //     //       .withArgs(this.smartAccount, 17);
  //     //   });
  //     // });
  //   });
}

module.exports = { shouldBehaveLikeAnAccount };
