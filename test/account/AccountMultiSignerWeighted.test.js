const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../helpers/eip712');
const { ERC4337Helper } = require('../helpers/erc4337');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey, MultiERC7913SigningKey } = require('../helpers/signers');
const { PackedUserOperation } = require('../helpers/eip712-types');
const { MAX_UINT64 } = require('../helpers/constants');

const { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } = require('./Account.behavior');
const { shouldBehaveLikeERC1271 } = require('../utils/cryptography/ERC1271.behavior');
const { shouldBehaveLikeERC7821 } = require('./extensions/ERC7821.behavior');

// Prepare signers in advance (RSA are long to initialize)
const signerECDSA1 = ethers.Wallet.createRandom();
const signerECDSA2 = ethers.Wallet.createRandom();
const signerECDSA3 = ethers.Wallet.createRandom();
const signerECDSA4 = ethers.Wallet.createRandom();
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
  const domain = { name: 'AccountMultiSignerWeighted', version: '1', chainId: entrypointDomain.chainId }; // Missing verifyingContract

  const makeMock = (signers, weights, threshold) =>
    helper
      .newAccount('$AccountMultiSignerWeightedMock', [signers, weights, threshold, 'AccountMultiSignerWeighted', '1'])
      .then(mock => {
        domain.verifyingContract = mock.address;
        return mock;
      });

  // Sign user operations using NonNativeSigner with MultiERC7913SigningKey
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

describe('AccountMultiSignerWeighted', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('Weighted signers with equal weights (1, 1, 1) and threshold=2', function () {
    beforeEach(async function () {
      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA3])); // 2 accounts, weight 1+1=2
      this.mock = await this.makeMock([signerECDSA1.address, signerECDSA2.address, signerECDSA3.address], [1, 1, 1], 2);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Weighted signers with varying weights (1, 2, 3) and threshold=3', function () {
    beforeEach(async function () {
      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2])); // 2 accounts, weight 1+2=3
      this.mock = await this.makeMock([signerECDSA1.address, signerECDSA2.address, signerECDSA3.address], [1, 2, 3], 3);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Mixed weighted signers with threshold=4', function () {
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

      this.signer = new NonNativeSigner(new MultiERC7913SigningKey([signerP256, signerRSA])); // 2 accounts, weight 2+3=5
      this.mock = await this.makeMock(
        [signerECDSA1.address, signerP256.bytes, signerRSA.bytes],
        [1, 2, 3],
        4, // Requires at least signer2 + signer3, or all three signers
      );
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('Weight management', function () {
    const signer1 = signerECDSA1.address;
    const signer2 = signerECDSA2.address;
    const signer3 = signerECDSA3.address;
    const signer4 = signerECDSA4.address;

    beforeEach(async function () {
      this.mock = await this.makeMock([signer1, signer2, signer3], [1, 2, 3], 4);
      await this.mock.deploy();
    });

    it('can get signer weights', async function () {
      await expect(this.mock.signerWeight(signer1)).to.eventually.equal(1);
      await expect(this.mock.signerWeight(signer2)).to.eventually.equal(2);
      await expect(this.mock.signerWeight(signer3)).to.eventually.equal(3);
    });

    it('can update signer weights', async function () {
      // Successfully updates weights and emits event
      await expect(this.mock.$_setSignerWeights([signer1, signer2], [5, 6]))
        .to.emit(this.mock, 'ERC7913SignerWeightChanged')
        .withArgs(signer1, 5)
        .to.emit(this.mock, 'ERC7913SignerWeightChanged')
        .withArgs(signer2, 6);

      await expect(this.mock.signerWeight(signer1)).to.eventually.equal(5);
      await expect(this.mock.signerWeight(signer2)).to.eventually.equal(6);
      await expect(this.mock.signerWeight(signer3)).to.eventually.equal(3); // unchanged
    });

    it("no-op doesn't emit an event", async function () {
      await expect(this.mock.$_setSignerWeights([signer1], [1])).to.not.emit(this.mock, 'ERC7913SignerWeightChanged');
    });

    it('cannot set weight to non-existent signer', async function () {
      // Reverts when setting weight for non-existent signer
      await expect(this.mock.$_setSignerWeights([signer4], [1]))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913NonexistentSigner')
        .withArgs(signer4.toLowerCase());
    });

    it('cannot set weight to 0', async function () {
      // Reverts when setting weight to 0
      await expect(this.mock.$_setSignerWeights([signer1], [0]))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913WeightedInvalidWeight')
        .withArgs(signer1.toLowerCase(), 0);
    });

    it('requires signers and weights arrays to have same length', async function () {
      // Reverts when arrays have different lengths
      await expect(this.mock.$_setSignerWeights([signer1, signer2], [1])).to.be.revertedWithCustomError(
        this.mock,
        'MultiSignerERC7913WeightedMismatchedLength',
      );

      await expect(this.mock.$_setSignerWeights([signer1], [1, 2])).to.be.revertedWithCustomError(
        this.mock,
        'MultiSignerERC7913WeightedMismatchedLength',
      );
    });

    it('validates threshold is reachable when updating weights', async function () {
      // First, lower the weights so the sum is exactly 9 (just enough for threshold=9)
      await expect(this.mock.$_setSignerWeights([signer1, signer2, signer3], [2, 3, 4]))
        .to.emit(this.mock, 'ERC7913SignerWeightChanged')
        .withArgs(signer1, 2)
        .to.emit(this.mock, 'ERC7913SignerWeightChanged')
        .withArgs(signer2, 3)
        .to.emit(this.mock, 'ERC7913SignerWeightChanged')
        .withArgs(signer3, 4);

      // Increase threshold to 9
      await expect(this.mock.$_setThreshold(9)).to.emit(this.mock, 'ERC7913ThresholdSet').withArgs(9);

      // Now try to lower weights so their sum is less than the threshold
      await expect(this.mock.$_setSignerWeights([signer1, signer2, signer3], [2, 2, 2])).to.be.revertedWithCustomError(
        this.mock,
        'MultiSignerERC7913UnreachableThreshold',
      );

      // Try to increase threshold to be larger than the total weight
      await expect(this.mock.$_setThreshold(10))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913UnreachableThreshold')
        .withArgs(9, 10);
    });

    it('reports default weight of 1 for signers without explicit weight', async function () {
      // Add a new signer without setting weight
      await this.mock.$_addSigners([signer4]);

      // Should have default weight of 1
      await expect(this.mock.signerWeight(signer4)).to.eventually.equal(1);
    });

    it('reports weight of 0 for invalid signers', async function () {
      // not authorized
      await expect(this.mock.signerWeight(signer4)).to.eventually.equal(0);
    });

    it('can get total weight of all signers', async function () {
      await expect(this.mock.totalWeight()).to.eventually.equal(6); // 1+2+3=6
    });

    it('totalWeight returns correct value when all signers have default weight of 1', async function () {
      // Deploy a new mock with all signers having default weight (1)
      const signers = [signerECDSA1.address, signerECDSA2.address, signerECDSA3.address];
      const defaultWeights = [1, 1, 1]; // All weights are 1 (default)
      const newMock = await this.makeMock(signers, defaultWeights, 2);
      await newMock.deploy();

      // totalWeight should return max(3, 3) = 3 when all weights are default
      await expect(newMock.totalWeight()).to.eventually.equal(3);

      // Clear custom weights to ensure we're using default weights
      await newMock.$_setSignerWeights(signers, [1, 1, 1]);

      // totalWeight should still be max(3, 3) = 3
      await expect(newMock.totalWeight()).to.eventually.equal(3);
    });

    it('_setSignerWeights correctly handles default weights when updating', async function () {
      await expect(this.mock.totalWeight()).to.eventually.equal(6); // 1+2+3=6

      // Set weight for signer1 from 1 (default) to 5
      await this.mock.$_setSignerWeights([signer1], [5]);
      await expect(this.mock.totalWeight()).to.eventually.equal(10); // 5+2+3=10

      // Reset signer1 to default weight (1)
      await this.mock.$_setSignerWeights([signer1], [1]);
      await expect(this.mock.totalWeight()).to.eventually.equal(6); // 1+2+3=6
    });

    it('updates total weight when adding and removing signers', async function () {
      await expect(this.mock.totalWeight()).to.eventually.equal(6); // 1+2+3=6

      // Add a new signer - should increase total weight by default weight (1)
      await this.mock.$_addSigners([signer4]);
      await expect(this.mock.totalWeight()).to.eventually.equal(7); // 1+2+3+1=7

      // Set weight to 5 - should increase total weight by 4
      await this.mock.$_setSignerWeights([signer4], [5]);
      await expect(this.mock.totalWeight()).to.eventually.equal(11); // 1+2+3+5=11

      // Remove signer - should decrease total weight by current weight (5)
      await this.mock.$_removeSigners([signer4]);
      await expect(this.mock.totalWeight()).to.eventually.equal(6); // 1+2+3=6
    });

    it('removing signers should not make threshold unreachable', async function () {
      // current threshold = 4, totalWeight = 1+2+3 = 6

      // After removing signer3, the threshold is unreachable because totalWeight = 1+2 = 3 but threshold = 4
      // [reverts]
      await expect(this.mock.$_removeSigners([signer3]))
        .to.be.revertedWithCustomError(this.mock, 'MultiSignerERC7913UnreachableThreshold')
        .withArgs(3, 4);

      // After removing signer1, the threshold is still reachable because totalWeight = 2+3 = 5 and threshold = 4
      // [does not revert]
      await expect(this.mock.$_removeSigners([signer1]))
        .to.emit(this.mock, 'ERC7913SignerRemoved')
        .withArgs(signer1)
        .to.not.emit(this.mock, 'ERC7913SignerWeightChanged');
    });

    it('should revert if total weight to overflow (_setSignerWeights)', async function () {
      await expect(this.mock.$_setSignerWeights([signer1, signer2, signer3], [1n, 1n, MAX_UINT64 - 1n]))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintDowncast')
        .withArgs(64, MAX_UINT64 + 1n);
    });

    it('should revert if total weight to overflow (_addSigner)', async function () {
      await this.mock.$_setSignerWeights([signer1, signer2, signer3], [1n, 1n, MAX_UINT64 - 2n]);
      await expect(this.mock.totalWeight()).to.eventually.equal(MAX_UINT64);

      await expect(this.mock.$_addSigners([signer4]))
        .to.be.revertedWithCustomError(this.mock, 'SafeCastOverflowedUintDowncast')
        .withArgs(64, MAX_UINT64 + 1n);
    });
  });
});
