const { ethers } = require('hardhat');
const { expect } = require('chai');
const {
  MODULE_TYPE_VALIDATOR,
  MODULE_TYPE_EXECUTOR,
  MODULE_TYPE_FALLBACK,
  MODULE_TYPE_HOOK,
  encodeSingle,
  encodeMode,
} = require('../../helpers/erc7579');
const { SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILURE } = require('../../helpers/erc4337');
const { hashTypedData, hashTypedDataEnvelopeStruct, domainSeparator, getDomain } = require('../../helpers/eip712');

function shouldBehaveLikeSignatureValidator() {
  describe('isModuleType', function () {
    it('returns true for MODULE_TYPE_VALIDATOR (1)', async function () {
      expect(await this.validator.isModuleType(MODULE_TYPE_VALIDATOR)).to.be.true;
    });

    it('returns false for MODULE_TYPE_EXECUTOR (2)', async function () {
      expect(await this.validator.isModuleType(MODULE_TYPE_EXECUTOR)).to.be.false;
    });

    it('returns false for MODULE_TYPE_FALLBACK (3)', async function () {
      expect(await this.validator.isModuleType(MODULE_TYPE_FALLBACK)).to.be.false;
    });

    it('returns false for MODULE_TYPE_HOOK (4)', async function () {
      expect(await this.validator.isModuleType(MODULE_TYPE_HOOK)).to.be.false;
    });
  });

  describe('validateUserOp', function () {
    it('returns SIG_VALIDATION_SUCCESS for a valid personal signature', async function () {
      const operation = await this.erc7579Account
        .createOp({
          callData: this.erc7579Account.interface.encodeFunctionData('execute', [
            encodeMode(),
            encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
          ]),
        })
        .then(op => op.sign(this.domain, this.signer));

      expect(
        await this.validator
          .connect(this.erc7579AccountAsSigner)
          .validateUserOp.staticCall(operation.packed, operation.hash),
      ).to.eq(SIG_VALIDATION_SUCCESS);
    });

    it('returns SIG_VALIDATION_FAILURE for an invalid personal signature', async function () {
      const operation = await this.erc7579Account
        .createOp({
          callData: this.erc7579Account.interface.encodeFunctionData('execute', [
            encodeMode(),
            encodeSingle(this.target, 42, this.target.interface.encodeFunctionData('mockFunctionExtra')),
          ]),
        })
        .then(op => op.sign(this.domain, this.signer));

      operation.signature = '0x00';

      expect(
        await this.validator
          .connect(this.erc7579AccountAsSigner)
          .validateUserOp.staticCall(operation.packed, operation.hash),
      ).to.eq(SIG_VALIDATION_FAILURE);
    });
  });

  describe('isValidSignatureWithSender', function () {
    const MAGIC_VALUE = '0x1626ba7e';

    beforeEach(async function () {
      this.eip712Verifier = await ethers.deployContract('$EIP712Verifier', ['EIP712Verifier', '1']);
    });

    it('returns true for a valid personal signature', async function () {
      const contents = ethers.randomBytes(32);
      const signature = await this.signer.signPersonal(this.domain, contents);
      expect(await this.validator.isValidSignatureWithSender(this.erc7579Account, contents, signature)).to.equal(
        MAGIC_VALUE,
      );
    });

    it('returns true for a valid typed data signature', async function () {
      const contents = ethers.randomBytes(32);
      const contentsType = 'SomeType(address foo,uint256 bar)';
      const appDomain = await getDomain(this.eip712Verifier);
      expect(
        await this.validator.isValidSignatureWithSender(
          this.erc7579Account,
          hashTypedData(appDomain, hashTypedDataEnvelopeStruct(this.domain, contents, contentsType)),
          ethers.concat([
            await this.signer.signTypedDataEnvelope(this.domain, appDomain, contents, contentsType),
            domainSeparator(appDomain),
            contents,
            ethers.toUtf8Bytes(contentsType),
            ethers.toBeHex(ethers.dataLength(ethers.toUtf8Bytes(contentsType)), 2),
          ]),
        ),
      ).to.equal(MAGIC_VALUE);
    });

    it('returns false for an invalid personal signature', async function () {
      const contents = ethers.randomBytes(32);
      const signature = '0x00';
      expect(await this.validator.isValidSignatureWithSender(this.erc7579Account, contents, signature)).to.not.equal(
        MAGIC_VALUE,
      );
    });
  });
}

module.exports = { shouldBehaveLikeSignatureValidator };
