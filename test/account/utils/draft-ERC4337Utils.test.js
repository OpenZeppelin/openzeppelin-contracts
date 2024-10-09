const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
  SIG_VALIDATION_SUCCESS,
  SIG_VALIDATION_FAILURE,
  toAuthorizer,
  packValidationData,
  packPaymasterData,
  UserOperation,
} = require('../../helpers/erc4337');
const { ZeroAddress } = require('ethers');
const { MAX_UINT48 } = require('../../helpers/constants');

const fixture = async () => {
  const [authorizer, sender, entrypoint, paymaster] = await ethers.getSigners();
  const utils = await ethers.deployContract('$ERC4337Utils');
  return { utils, authorizer, sender, entrypoint, paymaster };
};

describe('ERC4337Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('parseValidationData', function () {
    it('parses the validation data', async function () {
      const authorizer = this.authorizer.address;
      const validUntil = 0x12345678n;
      const validAfter = 0x9abcdef0n;
      const result = await this.utils.$parseValidationData(packValidationData(validAfter, validUntil, authorizer));
      expect(result).to.deep.equal([authorizer, validAfter, validUntil]);
    });

    it('returns an type(uint48).max if until is 0', async function () {
      const authorizer = this.authorizer.address;
      const validAfter = 0x12345678n;
      const result = await this.utils.$parseValidationData(packValidationData(validAfter, 0, authorizer));
      expect(result).to.deep.equal([authorizer, validAfter, MAX_UINT48]);
    });
  });

  describe('packValidationData', function () {
    it('packs the validation data', async function () {
      const authorizer = this.authorizer.address;
      const validUntil = 0x12345678n;
      const validAfter = 0x9abcdef0n;
      const result = await this.utils.$packValidationData(ethers.Typed.address(authorizer), validAfter, validUntil);
      expect(result).to.equal(packValidationData(validAfter, validUntil, authorizer));
    });

    it('packs the validation data (bool)', async function () {
      const success = false;
      const validUntil = 0x12345678n;
      const validAfter = 0x9abcdef0n;
      const result = await this.utils.$packValidationData(ethers.Typed.bool(success), validAfter, validUntil);
      expect(result).to.equal(packValidationData(validAfter, validUntil, toAuthorizer(SIG_VALIDATION_FAILURE)));
    });
  });

  describe('combineValidationData', function () {
    it('combines the validation data', async function () {
      const authorizer1 = ZeroAddress;
      const validUntil1 = 0x12345678n;
      const validAfter1 = 0x9abcdef0n;

      const authorizer2 = ZeroAddress;
      const validUntil2 = 0x87654321n;
      const validAfter2 = 0xabcdef90n;

      const result = await this.utils.$combineValidationData(
        packValidationData(validAfter1, validUntil1, authorizer1),
        packValidationData(validAfter2, validUntil2, authorizer2),
      );
      expect(result).to.equal(packValidationData(validAfter2, validUntil1, toAuthorizer(SIG_VALIDATION_SUCCESS)));
    });

    // address(bytes20(keccak256('openzeppelin.erc4337.tests')))
    for (const authorizers of [
      [ZeroAddress, '0xbf023313b891fd6000544b79e353323aa94a4f29'],
      ['0xbf023313b891fd6000544b79e353323aa94a4f29', ZeroAddress],
    ]) {
      it('returns SIG_VALIDATION_FAILURE if one of the authorizers is not address(0)', async function () {
        const validUntil1 = 0x12345678n;
        const validAfter1 = 0x9abcdef0n;

        const validUntil2 = 0x87654321n;
        const validAfter2 = 0xabcdef90n;

        const result = await this.utils.$combineValidationData(
          packValidationData(validAfter1, validUntil1, authorizers[0]),
          packValidationData(validAfter2, validUntil2, authorizers[1]),
        );
        expect(result).to.equal(packValidationData(validAfter2, validUntil1, toAuthorizer(SIG_VALIDATION_FAILURE)));
      });
    }
  });

  describe('getValidationData', function () {
    it('returns the validation data with valid validity range', async function () {
      const aggregator = this.authorizer.address;
      const validAfter = 0;
      const validUntil = MAX_UINT48;
      const result = await this.utils.$getValidationData(packValidationData(validAfter, validUntil, aggregator));
      expect(result).to.deep.equal([aggregator, false]);
    });

    it('returns the validation data with invalid validity range (expired)', async function () {
      const aggregator = this.authorizer.address;
      const validAfter = 0;
      const validUntil = 1;
      const result = await this.utils.$getValidationData(packValidationData(validAfter, validUntil, aggregator));
      expect(result).to.deep.equal([aggregator, true]);
    });

    it('returns the validation data with invalid validity range (not yet valid)', async function () {
      const aggregator = this.authorizer.address;
      const validAfter = MAX_UINT48;
      const validUntil = MAX_UINT48;
      const result = await this.utils.$getValidationData(packValidationData(validAfter, validUntil, aggregator));
      expect(result).to.deep.equal([aggregator, true]);
    });

    it('returns address(0) and false for validationData = 0', function () {
      return expect(this.utils.$getValidationData(0n)).to.eventually.deep.equal([ZeroAddress, false]);
    });
  });

  describe('hash', function () {
    it('returns the user operation hash', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1 });
      const chainId = await ethers.provider.getNetwork().then(({ chainId }) => chainId);
      const hash = await this.utils.$hash(userOp.packed);
      expect(hash).to.equal(userOp.hash(this.utils.target, chainId));
    });

    it('returns the operation hash with specified entrypoint and chainId', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1 });
      const chainId = 0xdeadbeef;
      const hash = await this.utils.$hash(userOp.packed, this.entrypoint.address, chainId);
      expect(hash).to.equal(userOp.hash(this.entrypoint.address, chainId));
    });
  });

  describe('userOp values', function () {
    it('returns verificationGasLimit', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1, verificationGas: 0x12345678n });
      expect(await this.utils.$verificationGasLimit(userOp.packed)).to.equal(userOp.verificationGas);
    });

    it('returns callGasLimit', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1, callGas: 0x12345678n });
      expect(await this.utils.$callGasLimit(userOp.packed)).to.equal(userOp.callGas);
    });

    it('returns maxPriorityFeePerGas', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1, maxPriorityFee: 0x12345678n });
      expect(await this.utils.$maxPriorityFeePerGas(userOp.packed)).to.equal(userOp.maxPriorityFee);
    });

    it('returns maxFeePerGas', async function () {
      const userOp = new UserOperation({ sender: this.sender.address, nonce: 1, maxFeePerGas: 0x12345678n });
      expect(await this.utils.$maxFeePerGas(userOp.packed)).to.equal(userOp.maxFeePerGas);
    });

    it('returns gasPrice', async function () {
      const userOp = new UserOperation({
        sender: this.sender.address,
        nonce: 1,
        maxPriorityFee: 0x12345678n,
        maxFeePerGas: 0x87654321n,
      });
      expect(
        await this.utils['$gasPrice((address,uint256,bytes,bytes,bytes32,uint256,bytes32,bytes,bytes))'](userOp.packed),
      ).to.equal(userOp.maxPriorityFee);
    });

    describe('paymasterAndData', function () {
      beforeEach(async function () {
        this.verificationGasLimit = 0x12345678n;
        this.postOpGasLimit = 0x87654321n;
        this.paymasterAndData = packPaymasterData(
          this.paymaster.address,
          this.verificationGasLimit,
          this.postOpGasLimit,
        );
        this.userOp = new UserOperation({
          sender: this.sender.address,
          nonce: 1,
          paymasterAndData: this.paymasterAndData,
        });
      });

      it('returns paymaster', async function () {
        expect(await this.utils.$paymaster(this.userOp.packed)).to.equal(this.paymaster.address);
      });

      it('returns verificationGasLimit', async function () {
        expect(await this.utils.$paymasterVerificationGasLimit(this.userOp.packed)).to.equal(this.verificationGasLimit);
      });

      it('returns postOpGasLimit', async function () {
        expect(await this.utils.$paymasterPostOpGasLimit(this.userOp.packed)).to.equal(this.postOpGasLimit);
      });
    });
  });
});
