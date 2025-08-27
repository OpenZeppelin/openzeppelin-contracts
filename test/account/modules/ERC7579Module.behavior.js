const { ethers } = require('hardhat');
const { expect } = require('chai');
const { SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILURE } = require('../../helpers/erc4337');

function shouldBehaveLikeERC7579Module() {
  describe('behaves like ERC7579Module', function () {
    it('identifies its module type correctly', async function () {
      await expect(this.mock.isModuleType(this.moduleType)).to.eventually.be.true;
      await expect(this.mock.isModuleType(999)).to.eventually.be.false; // Using random unassigned module type
    });

    it('handles installation, uninstallation, and re-installation', async function () {
      await expect(this.mockFromAccount.onInstall(this.installData || '0x')).to.not.be.reverted;
      await expect(this.mockFromAccount.onUninstall(this.uninstallData || '0x')).to.not.be.reverted;
      await expect(this.mockFromAccount.onInstall(this.installData || '0x')).to.not.be.reverted;
    });
  });
}

function shouldBehaveLikeERC7579Validator() {
  describe('behaves like ERC7579Validator', function () {
    const MAGIC_VALUE = '0x1626ba7e';
    const INVALID_VALUE = '0xffffffff';

    beforeEach(async function () {
      await this.mockFromAccount.onInstall(this.installData);
    });

    describe('validateUserOp', function () {
      it('returns SIG_VALIDATION_SUCCESS when signature is valid', async function () {
        const userOp = await this.mockAccount.createUserOp(this.userOp).then(op => this.signUserOp(op));
        await expect(this.mockFromAccount.validateUserOp(userOp.packed, userOp.hash())).to.eventually.equal(
          SIG_VALIDATION_SUCCESS,
        );
      });

      it('returns SIG_VALIDATION_FAILURE when signature is invalid', async function () {
        const userOp = await this.mockAccount.createUserOp(this.userOp);
        userOp.signature = this.invalidSignature || '0x00';
        await expect(this.mockFromAccount.validateUserOp(userOp.packed, userOp.hash())).to.eventually.equal(
          SIG_VALIDATION_FAILURE,
        );
      });
    });

    describe('isValidSignatureWithSender', function () {
      it('returns magic value for valid signature', async function () {
        const message = 'Hello, world!';
        const hash = ethers.hashMessage(message);
        const signature = await this.signer.signMessage(message);
        await expect(this.mockFromAccount.isValidSignatureWithSender(this.other, hash, signature)).to.eventually.equal(
          MAGIC_VALUE,
        );
      });

      it('returns failure value for invalid signature', async function () {
        const hash = ethers.hashMessage('Hello, world!');
        const signature = this.invalidSignature || '0x00';
        await expect(this.mock.isValidSignatureWithSender(this.other, hash, signature)).to.eventually.equal(
          INVALID_VALUE,
        );
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC7579Module,
  shouldBehaveLikeERC7579Validator,
};
