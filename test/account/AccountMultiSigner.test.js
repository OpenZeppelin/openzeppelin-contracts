const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../helpers/eip712');
const { ERC4337Helper } = require('../helpers/erc4337');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey, MultiERC7913SigningKey } = require('../helpers/signers');
const { MAX_UINT64 } = require('../helpers/constants');

const { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } = require('./Account.behavior');
const { shouldBehaveLikeERC1271 } = require('../utils/cryptography/ERC1271.behavior');
const { shouldBehaveLikeERC7821 } = require('./extensions/ERC7821.behavior');
const { PackedUserOperation } = require('../helpers/eip712-types');

// Prepare signers in advance (RSA are long to initialize)
const signerECDSA1 = ethers.Wallet.createRandom();
const signerECDSA2 = ethers.Wallet.createRandom();
const signerECDSA3 = ethers.Wallet.createRandom();
const signerECDSA4 = ethers.Wallet.createRandom(); // Unauthorized signer
const signerP256 = new NonNativeSigner(P256SigningKey.random());
const signerRSA = new NonNativeSigner(RSASHA256SigningKey.random());

// Minimal fixture common to the different signer verifiers
async function fixture() {
  // EOAs and environment
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-7913 verifiers
  const verifierP256 = await ethers.deployContract('ERC7913P256Verifier');
  const verifierRSA = await ethers.deployContract('ERC7913RSAVerifier');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();
  const entrypointDomain = await getDomain(predeploy.entrypoint.v08);
  const domain = { name: 'AccountMultiSigner', version: '1', chainId: entrypointDomain.chainId }; // Missing verifyingContract

  const makeMock = (signers, threshold) =>
    helper.newAccount('$AccountMultiSignerMock', [signers, threshold, 'AccountMultiSigner', '1']).then(mock => {
      domain.verifyingContract = mock.address;
      return mock;
    });

  // Sign user operations using MultiERC7913SigningKey
  const signUserOp = function (userOp) {
    return this.signer
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));
  };

  const invalidSig = function () {
    return this.signer.signMessage('invalid');
  };

  return {
    helper,
    verifierP256,
    verifierRSA,
    domain,
    target,
    beneficiary,
    other,
    makeMock,
    signUserOp,
    invalidSig,
  };
}

describe('AccountMultiSigner', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('Multi ECDSA signers with threshold=1', function () {
    beforeEach(async function () {
      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1]));
      this.mock = await this.makeMock([signerECDSA1.address], 1);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Multi ECDSA signers with threshold=2', function () {
    beforeEach(async function () {
      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2]));
      this.mock = await this.makeMock([signerECDSA1.address, signerECDSA2.address], 2);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Mixed signers with threshold=2', function () {
    beforeEach(async function () {
      // Create signers array with all three types
      signerP256.bytes = ethers.concat([
        this.verifierP256.target,
        signerP256.signingKey.publicKey.qx,
        signerP256.signingKey.publicKey.qy,
      ]);

      signerRSA.bytes = ethers.concat([
        this.verifierRSA.target,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes'],
          [signerRSA.signingKey.publicKey.e, signerRSA.signingKey.publicKey.n],
        ),
      ]);

      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerP256, signerRSA]));
      this.mock = await this.makeMock([signerECDSA1.address, signerP256.bytes, signerRSA.bytes], 2);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Signer management', function () {
    beforeEach(async function () {
      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2]));
      this.mock = await this.makeMock([signerECDSA1.address, signerECDSA2.address], 1);
      await this.mock.deploy();
    });

    it('can add signers', async function () {
      const signers = [signerECDSA3.address];

      // Successfully adds a signer
      const signersArrayBefore = await this.mock.getSigners(0, MAX_UINT64).then(s => s.map(ethers.getAddress));
      await expect(this.mock.$_addSigners(signers))
        .to.emit(this.mock, 'ERC7913SignerAdded')
        .withArgs(signerECDSA3.address);
      const signersArrayAfter = await this.mock.getSigners(0, MAX_UINT64).then(s => s.map(ethers.getAddress));
      expect(signersArrayAfter.length).to.equal(signersArrayBefore.length + 1);
      expect(signersArrayAfter).to.include(ethers.getAddress(signerECDSA3.address));

      // Reverts if the signer was already added
      await expect(this.mock.$_addSigners(signers))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913AlreadyExists')
        .withArgs(...signers.map(s => s.toLowerCase()));
    });

    it('can remove signers', async function () {
      const signers = [signerECDSA2.address];

      // Successfully removes an already added signer
      const signersArrayBefore = await this.mock.getSigners(0, MAX_UINT64).then(s => s.map(ethers.getAddress));
      await expect(this.mock.$_removeSigners(signers))
        .to.emit(this.mock, 'ERC7913SignerRemoved')
        .withArgs(signerECDSA2.address);
      const signersArrayAfter = await this.mock.getSigners(0, MAX_UINT64).then(s => s.map(ethers.getAddress));
      expect(signersArrayAfter.length).to.equal(signersArrayBefore.length - 1);
      expect(signersArrayAfter).to.not.include(ethers.getAddress(signerECDSA2.address));

      // Reverts removing a signer if it doesn't exist
      await expect(this.mock.$_removeSigners(signers))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913NonexistentSigner')
        .withArgs(...signers.map(s => s.toLowerCase()));

      // Reverts if removing a signer makes the threshold unreachable
      await expect(this.mock.$_removeSigners([signerECDSA1.address]))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913UnreachableThreshold')
        .withArgs(0, 1);
    });

    it('can change threshold', async function () {
      // Reachable threshold is set
      await expect(this.mock.$_setThreshold(2)).to.emit(this.mock, 'ERC7913ThresholdSet');

      // Unreachable threshold reverts
      await expect(this.mock.$_setThreshold(3))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913UnreachableThreshold')
        .withArgs(2, 3);

      // Zero threshold reverts
      await expect(this.mock.$_setThreshold(0)).to.be.revertedWithCustomError(
        this.mock,
        'MultiSignerERC7913ZeroThreshold',
      );
    });

    it('rejects invalid signer format', async function () {
      const invalidSigner = '0x123456'; // Too short

      await expect(this.mock.$_addSigners([invalidSigner]))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913InvalidSigner')
        .withArgs(invalidSigner);
    });

    it('can read signers and threshold', async function () {
      await expect(
        this.mock.getSigners(0, MAX_UINT64).then(s => s.map(ethers.getAddress)),
      ).to.eventually.have.deep.members([signerECDSA1.address, signerECDSA2.address]);

      await expect(this.mock.threshold()).to.eventually.equal(1);
    });

    it('checks if an address is a signer', async function () {
      // Should return true for authorized signers
      await expect(this.mock.isSigner(signerECDSA1.address)).to.eventually.be.true;
      await expect(this.mock.isSigner(signerECDSA2.address)).to.eventually.be.true;

      // Should return false for unauthorized signers
      await expect(this.mock.isSigner(signerECDSA3.address)).to.eventually.be.false;
      await expect(this.mock.isSigner(signerECDSA4.address)).to.eventually.be.false;
    });
  });

  describe('Signature validation', function () {
    const TEST_MESSAGE = ethers.keccak256(ethers.toUtf8Bytes('Test message'));

    beforeEach(async function () {
      // Set up mock with authorized signers
      this.mock = await this.makeMock([signerECDSA1.address, signerECDSA2.address], 1);
      await this.mock.deploy();
    });

    it('rejects signatures from unauthorized signers', async function () {
      // Create signatures including an unauthorized signer
      const authorizedSignature = await signerECDSA1.signMessage(ethers.getBytes(TEST_MESSAGE));
      const unauthorizedSignature = await signerECDSA4.signMessage(ethers.getBytes(TEST_MESSAGE));

      // Prepare signers and signatures arrays
      const signers = [
        signerECDSA1.address,
        signerECDSA4.address, // Unauthorized signer
      ].sort((a, b) => (ethers.toBigInt(ethers.keccak256(a)) < ethers.toBigInt(ethers.keccak256(b)) ? -1 : 1));

      const signatures = signers.map(signer => {
        if (signer === signerECDSA1.address) return authorizedSignature;
        return unauthorizedSignature;
      });

      // Encode the multi-signature
      const multiSignature = ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'bytes[]'], [signers, signatures]);

      // Should fail because one signer is not authorized
      await expect(this.mock.$_rawSignatureValidation(TEST_MESSAGE, multiSignature)).to.eventually.be.false;
    });

    it('rejects invalid signatures from authorized signers', async function () {
      // Create a valid signature and an invalid one from authorized signers
      const validSignature = await signerECDSA1.signMessage(ethers.getBytes(TEST_MESSAGE));
      const invalidSignature = await signerECDSA2.signMessage(ethers.toUtf8Bytes('Different message')); // Wrong message

      // Prepare signers and signatures arrays
      const signers = [signerECDSA1.address, signerECDSA2.address].sort((a, b) =>
        ethers.toBigInt(ethers.keccak256(a)) < ethers.toBigInt(ethers.keccak256(b)) ? -1 : 1,
      );

      const signatures = signers.map(signer => {
        if (signer === signerECDSA1.address) return validSignature;
        return invalidSignature;
      });

      // Encode the multi-signature
      const multiSignature = ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'bytes[]'], [signers, signatures]);

      // Should fail because one signature is invalid
      await expect(this.mock.$_rawSignatureValidation(TEST_MESSAGE, multiSignature)).to.eventually.be.false;
    });

    it('rejects signatures from unsorted signers', async function () {
      // Create a valid signature and an invalid one from authorized signers
      const validSignature1 = await signerECDSA1.signMessage(ethers.getBytes(TEST_MESSAGE));
      const validSignature2 = await signerECDSA2.signMessage(ethers.getBytes(TEST_MESSAGE));

      // Prepare signers and signatures arrays
      const signers = [signerECDSA1.address, signerECDSA2.address].sort((a, b) =>
        ethers.toBigInt(ethers.keccak256(a)) < ethers.toBigInt(ethers.keccak256(b)) ? -1 : 1,
      );
      const unsortedSigners = signers.reverse();
      const signatures = unsortedSigners.map(signer => {
        if (signer === signerECDSA1.address) return validSignature1;
        return validSignature2;
      });

      // Encode the multi-signature
      const multiSignature = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes[]', 'bytes[]'],
        [unsortedSigners, signatures],
      );

      // Should fail because signers are not sorted
      await expect(this.mock.$_rawSignatureValidation(TEST_MESSAGE, multiSignature)).to.eventually.be.false;
    });

    it('rejects signatures when signers.length != signatures.length', async function () {
      // Create a valid signature and an invalid one from authorized signers
      const validSignature1 = await signerECDSA1.signMessage(ethers.getBytes(TEST_MESSAGE));

      // Prepare signers and signatures arrays
      const signers = [signerECDSA1.address, signerECDSA2.address];
      const signatures = [validSignature1];

      // Encode the multi-signature
      const multiSignature = ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'bytes[]'], [signers, signatures]);

      // Should fail because signers and signatures arrays have different lengths
      await expect(this.mock.$_rawSignatureValidation(TEST_MESSAGE, multiSignature)).to.eventually.be.false;
    });

    it('rejects duplicated signers', async function () {
      // Create a valid signature
      const validSignature = await signerECDSA1.signMessage(ethers.getBytes(TEST_MESSAGE));

      // Prepare signers and signatures arrays
      const signers = [signerECDSA1.address, signerECDSA1.address];
      const signatures = [validSignature, validSignature];

      // Encode the multi-signature
      const multiSignature = ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'bytes[]'], [signers, signatures]);

      // Should fail because of duplicated signers
      await expect(this.mock.$_rawSignatureValidation(TEST_MESSAGE, multiSignature)).to.eventually.be.false;
    });
  });
});
