const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { MAX_UINT48 } = require('../../helpers/constants');
const { packValidationData, UserOperation } = require('../../helpers/erc4337');
const { ValidationRange } = require('../../helpers/enums');
const { clock, increaseTo } = require('../../helpers/time');
const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

const fixture = async () => {
  const [authorizer, sender, factory, paymaster] = await ethers.getSigners();
  const utils = await ethers.deployContract('$ERC4337Utils');
  const SIG_VALIDATION_SUCCESS = await utils.$SIG_VALIDATION_SUCCESS();
  const SIG_VALIDATION_FAILED = await utils.$SIG_VALIDATION_FAILED();

  return { utils, authorizer, sender, factory, paymaster, SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED };
};

describe('ERC4337Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('entrypoint', function () {
    it('v0.7.0', async function () {
      await expect(this.utils.$ENTRYPOINT_V07()).to.eventually.equal(predeploy.entrypoint.v07);
    });

    it('v0.8.0', async function () {
      await expect(this.utils.$ENTRYPOINT_V08()).to.eventually.equal(predeploy.entrypoint.v08);
    });

    it('v0.9.0', async function () {
      await expect(this.utils.$ENTRYPOINT_V09()).to.eventually.equal(predeploy.entrypoint.v09);
    });
  });

  describe('parseValidationData', function () {
    it('parses the validation data', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n;
      const validUntil = 0x23456789n;
      const validationData = packValidationData(validAfter, validUntil, authorizer);

      await expect(this.utils.$parseValidationData(validationData)).to.eventually.deep.equal([
        authorizer.address,
        validAfter,
        validUntil,
        ValidationRange.Timestamp,
      ]);
    });

    it('strips away the highest bit flag from the `validAfter` and `validUntil` fields', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n | 0x800000000000n;
      const validUntil = 0x23456789n | 0x800000000000n;
      const validationData = packValidationData(validAfter, validUntil, authorizer);

      await expect(this.utils.$parseValidationData(validationData)).to.eventually.deep.equal([
        authorizer.address,
        validAfter & ~0x800000000000n,
        validUntil & ~0x800000000000n,
        ValidationRange.Block,
      ]);
    });

    it('parses the validation data (block number)', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n;
      const validUntil = 0x23456789n;
      const validationData = packValidationData(validAfter, validUntil, authorizer, ValidationRange.Block);

      await expect(this.utils.$parseValidationData(validationData)).to.eventually.deep.equal([
        authorizer.address,
        validAfter,
        validUntil,
        ValidationRange.Block,
      ]);
    });

    it('returns a type(uint48).max if until is 0', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n;
      const validUntil = 0n;
      const validationData = packValidationData(validAfter, validUntil, authorizer);

      await expect(this.utils.$parseValidationData(validationData)).to.eventually.deep.equal([
        authorizer.address,
        validAfter,
        0x7fffffffffffn,
        ValidationRange.Timestamp,
      ]);
    });

    it('returns a type(uint48).max if until is 0 (block number)', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n;
      const validUntil = 0n;
      const validationData = packValidationData(validAfter, validUntil, authorizer, ValidationRange.Block);

      await expect(this.utils.$parseValidationData(validationData)).to.eventually.deep.equal([
        authorizer.address,
        validAfter,
        0x7fffffffffffn,
        ValidationRange.Block,
      ]);
    });

    it('parse canonical values', async function () {
      await expect(this.utils.$parseValidationData(this.SIG_VALIDATION_SUCCESS)).to.eventually.deep.equal([
        ethers.ZeroAddress,
        0n,
        0x7fffffffffffn,
        ValidationRange.Timestamp,
      ]);

      await expect(this.utils.$parseValidationData(this.SIG_VALIDATION_FAILED)).to.eventually.deep.equal([
        ADDRESS_ONE,
        0n,
        0x7fffffffffffn,
        ValidationRange.Timestamp,
      ]);
    });
  });

  describe('packValidationData', function () {
    it('packs the validation data with implicit timestamp', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n;
      const validUntil = 0x23456789n;
      const validationData = packValidationData(validAfter, validUntil, authorizer);

      await expect(
        this.utils.$packValidationData(ethers.Typed.address(authorizer), validAfter, validUntil),
      ).to.eventually.equal(validationData);

      await expect(
        this.utils.$packValidationData(ethers.Typed.address(authorizer), validAfter | 0x800000000000n, validUntil),
      ).to.eventually.equal(validationData);

      await expect(
        this.utils.$packValidationData(ethers.Typed.address(authorizer), validAfter, validUntil | 0x800000000000n),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data with implicit block number', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n | 0x800000000000n;
      const validUntil = 0x23456789n | 0x800000000000n;
      const validationData = packValidationData(validAfter, validUntil, authorizer);

      await expect(
        this.utils.$packValidationData(ethers.Typed.address(authorizer), validAfter, validUntil),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data with explicit timestamp', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n | 0x800000000000n; // extra flag will be cleaned up
      const validUntil = 0x23456789n | 0x800000000000n; // extra flag will be cleaned up
      const validationData = packValidationData(validAfter, validUntil, authorizer, ValidationRange.Timestamp);

      await expect(
        this.utils.$packValidationData(
          ethers.Typed.address(authorizer),
          validAfter,
          validUntil,
          ethers.Typed.uint8(ValidationRange.Timestamp),
        ),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data with explicit block number', async function () {
      const authorizer = this.authorizer;
      const validAfter = 0x12345678n; // missing flag will be added
      const validUntil = 0x23456789n; // missing flag will be added
      const validationData = packValidationData(validAfter, validUntil, authorizer, ValidationRange.Block);

      await expect(
        this.utils.$packValidationData(
          ethers.Typed.address(authorizer),
          validAfter,
          validUntil,
          ethers.Typed.uint8(ValidationRange.Block),
        ),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data (bool) with implicit timestamp', async function () {
      const success = false;
      const validAfter = 0x12345678n;
      const validUntil = 0x23456789n;
      const validationData = packValidationData(validAfter, validUntil, false);

      await expect(
        this.utils.$packValidationData(ethers.Typed.bool(success), validAfter, validUntil),
      ).to.eventually.equal(validationData);

      await expect(
        this.utils.$packValidationData(ethers.Typed.bool(success), validAfter | 0x800000000000n, validUntil),
      ).to.eventually.equal(validationData);

      await expect(
        this.utils.$packValidationData(ethers.Typed.bool(success), validAfter, validUntil | 0x800000000000n),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data (bool) with implicit block number', async function () {
      const success = false;
      const validAfter = 0x12345678n | 0x800000000000n;
      const validUntil = 0x23456789n | 0x800000000000n;
      const validationData = packValidationData(validAfter, validUntil, false);

      await expect(
        this.utils.$packValidationData(ethers.Typed.bool(success), validAfter, validUntil),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data (bool) with explicit timestamp', async function () {
      const success = false;
      const validAfter = 0x12345678n | 0x800000000000n; // extra flag will be cleaned up
      const validUntil = 0x23456789n | 0x800000000000n; // extra flag will be cleaned up
      const validationData = packValidationData(validAfter, validUntil, false, ValidationRange.Timestamp);

      await expect(
        this.utils.$packValidationData(
          ethers.Typed.bool(success),
          validAfter,
          validUntil,
          ethers.Typed.uint8(ValidationRange.Timestamp),
        ),
      ).to.eventually.equal(validationData);
    });

    it('packs the validation data (bool) with block number', async function () {
      const success = false;
      const validAfter = 0x12345678n; // missing flag will be added
      const validUntil = 0x23456789n; // missing flag will be added
      const validationData = packValidationData(validAfter, validUntil, false, ValidationRange.Block);

      await expect(
        this.utils.$packValidationData(
          ethers.Typed.bool(success),
          validAfter,
          validUntil,
          ethers.Typed.uint8(ValidationRange.Block),
        ),
      ).to.eventually.equal(validationData);
    });

    it('packing reproduced canonical values', async function () {
      await expect(this.utils.$packValidationData(ethers.Typed.bool(true), 0n, 0n)).to.eventually.equal(
        this.SIG_VALIDATION_SUCCESS,
      );
      await expect(this.utils.$packValidationData(ethers.Typed.bool(false), 0n, 0n)).to.eventually.equal(
        this.SIG_VALIDATION_FAILED,
      );
      await expect(
        this.utils.$packValidationData(ethers.Typed.address(ethers.ZeroAddress), 0n, 0n),
      ).to.eventually.equal(this.SIG_VALIDATION_SUCCESS);
      await expect(this.utils.$packValidationData(ethers.Typed.address(ADDRESS_ONE), 0n, 0n)).to.eventually.equal(
        this.SIG_VALIDATION_FAILED,
      );
    });
  });

  describe('combineValidationData', function () {
    const validUntil1 = 0x01234567n;
    const validAfter1 = 0x09abcdefn;
    const validUntil2 = 0x08765432n;
    const validAfter2 = 0x0abcdef9n;

    it('combines the validation data', async function () {
      const validationData1 = packValidationData(validAfter1, validUntil1, ethers.ZeroAddress);
      const validationData2 = packValidationData(validAfter2, validUntil2, ethers.ZeroAddress);
      const expected = packValidationData(validAfter2, validUntil1, true);

      // check symmetry
      await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
      await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
    });

    it('combines the validation data with explicit timestamp', async function () {
      const validationData1 = packValidationData(
        validAfter1,
        validUntil1,
        ethers.ZeroAddress,
        ValidationRange.Timestamp,
      );
      const validationData2 = packValidationData(
        validAfter2,
        validUntil2,
        ethers.ZeroAddress,
        ValidationRange.Timestamp,
      );
      const expected = packValidationData(validAfter2, validUntil1, true, ValidationRange.Timestamp);

      // check symmetry
      await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
      await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
    });

    it('combines the validation data with block number', async function () {
      const validationData1 = packValidationData(validAfter1, validUntil1, ethers.ZeroAddress, ValidationRange.Block);
      const validationData2 = packValidationData(validAfter2, validUntil2, ethers.ZeroAddress, ValidationRange.Block);
      const expected = packValidationData(validAfter2, validUntil1, true, ValidationRange.Block);

      // check symmetry
      await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
      await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
    });

    it('returns SIG_VALIDATION_FAILURE if the validation ranges differ', async function () {
      const validationData1 = packValidationData(
        validAfter1,
        validUntil1,
        ethers.ZeroAddress,
        ValidationRange.Timestamp,
      );
      const validationData2 = packValidationData(validAfter2, validUntil2, ethers.ZeroAddress, ValidationRange.Block);

      // check symmetry
      await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(
        this.SIG_VALIDATION_FAILED,
      );
      await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(
        this.SIG_VALIDATION_FAILED,
      );
    });

    for (const [authorizer1, authorizer2] of [
      [ethers.ZeroAddress, '0xbf023313b891fd6000544b79e353323aa94a4f29'],
      ['0xbf023313b891fd6000544b79e353323aa94a4f29', ethers.ZeroAddress],
    ]) {
      it('returns SIG_VALIDATION_FAILURE if one of the authorizers is not address(0)', async function () {
        const validationData1 = packValidationData(validAfter1, validUntil1, authorizer1);
        const validationData2 = packValidationData(validAfter2, validUntil2, authorizer2);
        const expected = packValidationData(validAfter2, validUntil1, false);

        // check symmetry
        await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
        await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
      });

      it('returns SIG_VALIDATION_FAILURE if one of the authorizers is not address(0) with explicit timestamp', async function () {
        const validationData1 = packValidationData(validAfter1, validUntil1, authorizer1, ValidationRange.Timestamp);
        const validationData2 = packValidationData(validAfter2, validUntil2, authorizer2, ValidationRange.Timestamp);
        const expected = packValidationData(validAfter2, validUntil1, false, ValidationRange.Timestamp);

        // check symmetry
        await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
        await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
      });

      it('returns SIG_VALIDATION_FAILURE if one of the authorizers is not address(0) with block number', async function () {
        const validationData1 = packValidationData(validAfter1, validUntil1, authorizer1, ValidationRange.Block);
        const validationData2 = packValidationData(validAfter2, validUntil2, authorizer2, ValidationRange.Block);
        const expected = packValidationData(validAfter2, validUntil1, false, ValidationRange.Block);

        // check symmetry
        await expect(this.utils.$combineValidationData(validationData1, validationData2)).to.eventually.equal(expected);
        await expect(this.utils.$combineValidationData(validationData2, validationData1)).to.eventually.equal(expected);
      });
    }
  });

  describe('getValidationData', function () {
    for (const [name, range] of Object.entries({
      timestamp: ValidationRange.Timestamp,
      blocknumber: ValidationRange.Block,
    })) {
      describe(`using ${name}`, function () {
        it('returns the validation data with valid validity range', async function () {
          const aggregator = this.authorizer;
          const validAfter = 0;
          const validUntil = MAX_UINT48;
          const validationData = packValidationData(validAfter, validUntil, aggregator, range);

          await expect(this.utils.$getValidationData(validationData)).to.eventually.deep.equal([
            aggregator.address,
            false,
          ]);
        });

        it('returns the validation data with invalid validity range (expired)', async function () {
          const aggregator = this.authorizer;
          const validAfter = await clock[name]();
          const validUntil = validAfter + 10n;
          const validationData = packValidationData(validAfter, validUntil, aggregator, range);

          await increaseTo[name](validUntil + 1n);
          await expect(this.utils.$getValidationData(validationData)).to.eventually.deep.equal([
            aggregator.address,
            true,
          ]);
        });

        it('returns the validation data with invalid validity range (not yet valid)', async function () {
          const aggregator = this.authorizer;
          const validAfter = (await clock[name]()) + 1n;
          const validUntil = validAfter + 10n;
          const validationData = packValidationData(validAfter, validUntil, aggregator, range);

          await expect(this.utils.$getValidationData(validationData)).to.eventually.deep.equal([
            aggregator.address,
            true,
          ]);
        });

        it('returns the validation data with invalid validity range (current == validAfter)', async function () {
          const aggregator = this.authorizer;
          const validAfter = await clock[name]();
          const validUntil = validAfter + 10n;
          const validationData = packValidationData(validAfter, validUntil, aggregator, range);

          await expect(this.utils.$getValidationData(validationData)).to.eventually.deep.equal([
            aggregator.address,
            true,
          ]);
        });

        it('returns the validation data with valid validity range (current == validUntil)', async function () {
          const aggregator = this.authorizer;
          const validAfter = await clock[name]();
          const validUntil = validAfter + 10n;
          const validationData = packValidationData(validAfter, validUntil, aggregator, range);

          await increaseTo[name](validUntil);
          await expect(this.utils.$getValidationData(validationData)).to.eventually.deep.equal([
            aggregator.address,
            false,
          ]);
        });
      });
    }

    it('returns address(0) and false for validationData = 0', async function () {
      await expect(this.utils.$getValidationData(0n)).to.eventually.deep.equal([ethers.ZeroAddress, false]);
    });
  });

  describe('hash', function () {
    for (const [version, instance] of Object.entries(predeploy.entrypoint)) {
      it(`returns the operation hash for entrypoint ${version}`, async function () {
        const userOp = new UserOperation({ sender: this.sender, nonce: 1 });
        const expected = await userOp.hash(instance);

        await expect(this.utils.$hash(userOp.packed, instance)).to.eventually.equal(expected);
      });
    }
  });

  describe('userOp values', function () {
    describe('intiCode', function () {
      beforeEach(async function () {
        this.userOp = new UserOperation({
          sender: this.sender,
          nonce: 1,
          verificationGas: 0x12345678n,
          factory: this.factory,
          factoryData: '0x123456',
        });

        this.emptyUserOp = new UserOperation({
          sender: this.sender,
          nonce: 1,
        });
      });

      it('returns factory', async function () {
        await expect(this.utils.$factory(this.userOp.packed)).to.eventually.equal(this.factory);
        await expect(this.utils.$factory(this.emptyUserOp.packed)).to.eventually.equal(ethers.ZeroAddress);
      });

      it('returns factoryData', async function () {
        await expect(this.utils.$factoryData(this.userOp.packed)).to.eventually.equal('0x123456');
        await expect(this.utils.$factoryData(this.emptyUserOp.packed)).to.eventually.equal('0x');
      });
    });

    it('returns verificationGasLimit', async function () {
      const userOp = new UserOperation({ sender: this.sender, nonce: 1, verificationGas: 0x12345678n });
      await expect(this.utils.$verificationGasLimit(userOp.packed)).to.eventually.equal(userOp.verificationGas);
    });

    it('returns callGasLimit', async function () {
      const userOp = new UserOperation({ sender: this.sender, nonce: 1, callGas: 0x12345678n });
      await expect(this.utils.$callGasLimit(userOp.packed)).to.eventually.equal(userOp.callGas);
    });

    it('returns maxPriorityFeePerGas', async function () {
      const userOp = new UserOperation({ sender: this.sender, nonce: 1, maxPriorityFee: 0x12345678n });
      await expect(this.utils.$maxPriorityFeePerGas(userOp.packed)).to.eventually.equal(userOp.maxPriorityFee);
    });

    it('returns maxFeePerGas', async function () {
      const userOp = new UserOperation({ sender: this.sender, nonce: 1, maxFeePerGas: 0x12345678n });
      await expect(this.utils.$maxFeePerGas(userOp.packed)).to.eventually.equal(userOp.maxFeePerGas);
    });

    it('returns gasPrice', async function () {
      const userOp = new UserOperation({
        sender: this.sender,
        nonce: 1,
        maxPriorityFee: 0x12345678n,
        maxFeePerGas: 0x87654321n,
      });
      await expect(this.utils.$gasPrice(userOp.packed)).to.eventually.equal(userOp.maxPriorityFee);
    });

    describe('paymasterAndData', function () {
      beforeEach(async function () {
        this.userOp = new UserOperation({
          sender: this.sender,
          nonce: 1,
          paymaster: this.paymaster,
          paymasterVerificationGasLimit: 0x12345678n,
          paymasterPostOpGasLimit: 0x87654321n,
          paymasterData: '0xbeefcafe',
        });

        this.emptyUserOp = new UserOperation({
          sender: this.sender,
          nonce: 1,
        });
      });

      it('returns paymaster', async function () {
        await expect(this.utils.$paymaster(this.userOp.packed)).to.eventually.equal(this.userOp.paymaster);
        await expect(this.utils.$paymaster(this.emptyUserOp.packed)).to.eventually.equal(ethers.ZeroAddress);
      });

      it('returns verificationGasLimit', async function () {
        await expect(this.utils.$paymasterVerificationGasLimit(this.userOp.packed)).to.eventually.equal(
          this.userOp.paymasterVerificationGasLimit,
        );
        await expect(this.utils.$paymasterVerificationGasLimit(this.emptyUserOp.packed)).to.eventually.equal(0n);
      });

      it('returns postOpGasLimit', async function () {
        await expect(this.utils.$paymasterPostOpGasLimit(this.userOp.packed)).to.eventually.equal(
          this.userOp.paymasterPostOpGasLimit,
        );
        await expect(this.utils.$paymasterPostOpGasLimit(this.emptyUserOp.packed)).to.eventually.equal(0n);
      });

      it('returns data', async function () {
        await expect(this.utils.$paymasterData(this.userOp.packed)).to.eventually.equal(this.userOp.paymasterData);
        await expect(this.utils.$paymasterData(this.emptyUserOp.packed)).to.eventually.equal('0x');
      });

      it('returns data without signature', async function () {
        this.userOp.paymasterSignature =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
        await expect(this.utils.$paymasterData(this.userOp.packed)).to.eventually.equal(this.userOp.paymasterData);
      });

      it('returns paymaster signature', async function () {
        this.userOp.paymasterSignature =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
        await expect(this.utils.$paymasterSignature(this.userOp.packed)).to.eventually.equal(
          this.userOp.paymasterSignature,
        );
      });

      it('returns empty signature when magic is not present', async function () {
        await expect(this.utils.$paymasterSignature(this.userOp.packed)).to.eventually.equal('0x');
      });

      it('returns empty signature when paymasterAndData has an unsafe length (<10 bytes)', async function () {
        const packedUserOp = this.userOp.packed;

        packedUserOp.paymasterAndData = '0xe325a297439656'; // part of the magic value (7 bytes)
        await expect(this.utils.$paymasterSignature(packedUserOp)).to.eventually.equal('0x');

        packedUserOp.paymasterAndData = '0x0022e325a297439656'; // 00 + magic value (9 bytes)
        await expect(this.utils.$paymasterSignature(packedUserOp)).to.eventually.equal('0x');
      });

      it('returns empty signature when paymasterAndData length is less than 62 + signature length', async function () {
        const packedUserOp = this.userOp.packed;
        packedUserOp.paymasterAndData = ethers.concat([
          '0x437d871626ffaa4f2a3d24eb54fbc9af36c4c75fbf1b69c2d109b1ce43ab3eaa50b8aba09d395e08a8687c940be78d6533536a78', // 52 random bytes
          // Missing signature
          '0x0001', // Non zero signature length
          '0x22e325a297439656', // magic value
        ]);

        await expect(this.utils.$paymasterSignature(packedUserOp)).to.eventually.equal('0x');
      });
    });
  });
});
