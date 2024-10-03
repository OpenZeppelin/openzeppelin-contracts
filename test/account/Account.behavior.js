const { ethers } = require('hardhat');
const { expect } = require('chai');
const { impersonate } = require('../helpers/account');
const { SIG_VALIDATION_SUCCESS } = require('../helpers/erc4337');

function shouldBehaveLikeAnAccount() {
  describe('entryPoint', function () {
    it('should return the canonical entrypoint', async function () {
      await this.smartAccount.deploy();
      expect(await this.smartAccount.entryPoint()).to.equal(await this.entrypoint.getAddress());
    });
  });

  describe('validateUserOp', function () {
    beforeEach(async function () {
      await this.smartAccount.deploy();
    });

    // it('should revert if the caller is not the canonical entrypoint', async function () {});

    describe('when the caller is the canonical entrypoint', function () {
      beforeEach(async function () {
        await impersonate(await this.entrypoint.getAddress());
      });

      it('should return SIG_VALIDATION_SUCCESS if the signature is valid', async function () {
        const operation = await this.smartAccount
          .createOp({
            callData: this.smartAccount.interface.encodeFunctionData('executeUserOp', [
              await this.target.getAddress(),
              this.target.interface.encodeFunctionData('mockFunctionExtra'),
            ]),
          })
          .then(op => op.sign(this.signer));
        expect(await this.smartAccount.validateUserOp(operation, operation.hash, 0)).to.equal(SIG_VALIDATION_SUCCESS);
      });

      // it('should return SIG_VALIDATION_FAILURE if the signature is invalid', async function () {});

      // it('should pay missing account funds for execution', async function () {});
    });
  });

  // describe('executeUserOp', function () {
  //   describe('when not deployed', function () {
  //     beforeEach(async function () {
  //       expect(await ethers.provider.getCode(this.smartAccount.address)).to.equal('0x');
  //       expect(await this.smartAccount.getNonce()).to.equal(0);
  //     });

  //     it('should be created with handleOps', async function () {
  //       const operation = await this.smartAccount
  //         .createOp({
  //           callData: this.smartAccount.interface.encodeFunctionData(
  //             'executeUserOp',
  //             ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunctionExtra')]),
  //           ),
  //         })
  //         .then(op => op.addInitCode())
  //         .then(op => op.sign(this.signer));

  //       await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary))
  //         .to.emit(this.target, 'AccountDeployed')
  //         .withArgs(operation.hash, this.smartAccount, this.factory, ethers.ZeroAddress)
  //         .to.emit(this.target, 'MockFunctionCalledExtra')
  //         .withArgs(this.smartAccount, 17);
  //     });

  //     it('should revert if the nonce is not 0', async function () {
  //       const operation = await this.smartAccount
  //         .createOp({
  //           callData: this.smartAccount.interface.encodeFunctionData(
  //             'executeUserOp',
  //             ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunction')]),
  //           ),
  //         })
  //         .then(op => op.sign(this.signer));

  //       await expect(this.entrypoint.handleOps([operation.packed], this.beneficiary)).to.be.revertedWith(
  //         'Account: INVALID_NONCE',
  //       );
  //     });

  //     afterEach(async function () {
  //       expect(await ethers.provider.getCode(this.smartAccount.address)).to.not.equal('0x');
  //       expect(await this.smartAccount.getNonce()).to.equal(1);
  //     });
  //   });

  //   describe('when deployed', function () {
  //     beforeEach(async function () {
  //       await this.smartAccount.deploy();
  //     });

  //     it('should increase nonce', async function () {
  //       const operation = await this.smartAccount
  //         .createOp({
  //           callData: this.smartAccount.interface.encodeFunctionData(
  //             'executeUserOp',
  //             ethers.concat([this.target, this.target.interface.encodeFunctionData('mockFunction')]),
  //           ),
  //         })
  //         .then(op => op.sign(this.signer));

  //       expect(this.smartAccount.getNonce()).to.equal(0);
  //       await this.entrypoint.handleOps([operation.packed], this.beneficiary);
  //       expect(this.smartAccount.getNonce()).to.equal(1);
  //     });
  //   });

  //   // beforeEach('fund account', async function () {
  //   //   await this.smartAccounts.relayer.sendTransaction({ to: this.smartAccount, value: ethers.parseEther('1') });
  //   // });
  //   // describe('account not deployed yet', function () {
  //   //   it('success: deploy and call', async function () {
  //   //     const operation = await this.smartAccount
  //   //       .createOp({
  //   //         callData: this.smartAccount.interface.encodeFunctionData('execute', [
  //   //           encodeMode(),
  //   //           encodeSingle(this.target, 17, this.target.interface.encodeFunctionData('mockFunctionExtra')),
  //   //         ]),
  //   //       })
  //   //       .then(op => op.addInitCode())
  //   //       .then(op => op.sign(this.signers));
  //   //     await expect(this.entrypoint.handleOps([operation.packed], this.smartAccounts.beneficiary))
  //   //       .to.emit(this.entrypoint, 'AccountDeployed')
  //   //       .withArgs(operation.hash, this.smartAccount, this.factory, ethers.ZeroAddress)
  //   //       .to.emit(this.target, 'MockFunctionCalledExtra')
  //   //       .withArgs(this.smartAccount, 17);
  //   //   });
  //   // });
  // });
}

module.exports = { shouldBehaveLikeAnAccount };
