const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { ERC4337Helper } = require('../../helpers/erc4337');
const {
  MODULE_TYPE_VALIDATOR,
  CALL_TYPE_CALL,
  EXEC_TYPE_DEFAULT,
  encodeMode,
  encodeSingle,
} = require('../../helpers/erc7579');
const { NonNativeSigner, MultiERC7913SigningKey } = require('../../helpers/signers');
const { MAX_UINT64 } = require('../../helpers/constants');

const { shouldBehaveLikeERC7579Module } = require('./ERC7579Module.behavior');

// Prepare signers in advance
const signerECDSA1 = ethers.Wallet.createRandom();
const signerECDSA2 = ethers.Wallet.createRandom();
const signerECDSA3 = ethers.Wallet.createRandom();
const signerECDSA4 = ethers.Wallet.createRandom(); // Unauthorized signer

async function fixture() {
  // Deploy ERC-7579 multisig weighted module
  const mock = await ethers.deployContract('$ERC7579MultisigWeighted');
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();

  // Prepare signers with weights
  const signers = [signerECDSA1.address, signerECDSA2.address, signerECDSA3.address];
  const weights = [1, 2, 3]; // Different weights for each signer
  const threshold = 3; // Set to 3 to match the default weights during initialization (3 signers × 1 weight = 3)

  // Create multi-signer instance
  const multiSigner = new NonNativeSigner(
    new MultiERC7913SigningKey([signerECDSA1, signerECDSA2, signerECDSA3], weights),
  );

  // Prepare module installation data
  const installData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes[]', 'uint256', 'uint256[]'],
    [signers, threshold, weights],
  );

  // ERC-7579 account
  const mockAccount = await helper.newAccount('$AccountERC7579');
  const mockFromAccount = await impersonate(mockAccount.address).then(asAccount => mock.connect(asAccount));
  const mockAccountFromEntrypoint = await impersonate(predeploy.entrypoint.v08.target).then(asEntrypoint =>
    mockAccount.connect(asEntrypoint),
  );

  const moduleType = MODULE_TYPE_VALIDATOR;

  await mockAccount.deploy();

  const args = [42, '0x1234'];
  const data = target.interface.encodeFunctionData('mockFunctionWithArgs', args);
  const calldata = encodeSingle(target, 0, data);
  const mode = encodeMode({ callType: CALL_TYPE_CALL, execType: EXEC_TYPE_DEFAULT });

  return {
    moduleType,
    mock,
    mockAccount,
    mockFromAccount,
    mockAccountFromEntrypoint,
    target,
    installData,
    args,
    data,
    calldata,
    mode,
    signers,
    weights,
    threshold,
    multiSigner,
  };
}

describe('ERC7579MultisigWeighted', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7579Module();

  it('sets initial signers, weights, and threshold on installation', async function () {
    const tx = await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);

    for (const signer of this.signers) {
      await expect(tx)
        .to.emit(this.mock, 'ERC7913SignerAdded')
        .withArgs(this.mockAccount.address, signer.toLowerCase());
    }
    await expect(tx).to.emit(this.mock, 'ERC7913ThresholdSet').withArgs(this.mockAccount.address, this.threshold);

    // Verify signers and weights were set correctly
    for (let i = 0; i < this.signers.length; i++) {
      await expect(this.mock.signerWeight(this.mockAccount.address, this.signers[i])).to.eventually.equal(
        this.weights[i],
      );
    }

    // Verify threshold was set correctly
    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(this.threshold);

    // onInstall is allowed again but is a noop
    const newSigners = [signerECDSA4.address];
    const newWeights = [5];
    const newThreshold = 10;

    await this.mockFromAccount.onInstall(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes[]', 'uint256', 'uint256[]'],
        [newSigners, newThreshold, newWeights],
      ),
    );

    // Should still have the original signers, weights, and threshold
    await expect(this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64)).to.eventually.deep.equal(this.signers);

    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(this.threshold);
  });

  it('cleans up signers, weights, and threshold on uninstallation', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    await this.mockAccountFromEntrypoint.uninstallModule(this.moduleType, this.mock.target, '0x');

    // Verify signers and threshold are cleared
    await expect(this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64)).to.eventually.deep.equal([]);
    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(0);

    // Verify weights are cleared (by checking a previously existing signer)
    await expect(this.mock.signerWeight(this.mockAccount.address, this.signers[0])).to.eventually.equal(0);
  });

  describe('signer and weight management', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    });

    it('can add signers with default weight', async function () {
      const newSigners = [signerECDSA4.address];

      // Get signers before adding
      const signersBefore = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Add new signer
      const tx = await this.mockFromAccount.addSigners(newSigners);
      for (const signer of newSigners) {
        await expect(tx)
          .to.emit(this.mock, 'ERC7913SignerAdded')
          .withArgs(this.mockAccount.address, signer.toLowerCase());
      }

      // Get signers after adding
      const signersAfter = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Check that new signer was added
      expect(signersAfter.length).to.equal(signersBefore.length + 1);
      expect(signersAfter.map(ethers.getAddress)).to.include(ethers.getAddress(signerECDSA4.address));

      // Check that default weight is 1
      await expect(this.mock.signerWeight(this.mockAccount.address, signerECDSA4.address)).to.eventually.equal(1);

      // Check that total weight was updated
      const totalWeight = await this.mock.totalWeight(this.mockAccount.address);
      expect(totalWeight).to.equal(1 + 2 + 3 + 1); // Sum of all weights including new signer
    });

    it('can set signer weights', async function () {
      // Set new weights for existing signers
      const updateSigners = [this.signers[0], this.signers[1]];
      const newWeights = [5, 5];

      await expect(this.mockFromAccount.setSignerWeights(updateSigners, newWeights))
        .to.emit(this.mock, 'ERC7579MultisigWeightChanged')
        .withArgs(this.mockAccount.address, updateSigners[0].toLowerCase(), newWeights[0])
        .to.emit(this.mock, 'ERC7579MultisigWeightChanged')
        .withArgs(this.mockAccount.address, updateSigners[1].toLowerCase(), newWeights[1]);

      // Verify new weights
      await expect(this.mock.signerWeight(this.mockAccount.address, updateSigners[0])).to.eventually.equal(
        newWeights[0],
      );
      await expect(this.mock.signerWeight(this.mockAccount.address, updateSigners[1])).to.eventually.equal(
        newWeights[1],
      );

      // Third signer weight should remain unchanged
      await expect(this.mock.signerWeight(this.mockAccount.address, this.signers[2])).to.eventually.equal(
        this.weights[2],
      );

      // Check total weight
      await expect(this.mock.totalWeight(this.mockAccount.address)).to.eventually.equal(5 + 5 + 3); // Sum of all weights after update
    });

    it('cannot set weight to non-existent signer', async function () {
      const randomSigner = ethers.Wallet.createRandom().address;

      // Reverts when setting weight for non-existent signer
      await expect(this.mockFromAccount.setSignerWeights([randomSigner], [1]))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigNonexistentSigner')
        .withArgs(randomSigner.toLowerCase());
    });

    it('cannot set weight to 0', async function () {
      // Reverts when setting weight to 0
      await expect(this.mockFromAccount.setSignerWeights([this.signers[0]], [0]))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigInvalidWeight')
        .withArgs(this.signers[0].toLowerCase(), 0);
    });

    it('requires signers and weights arrays to have same length', async function () {
      // Reverts when arrays have different lengths
      await expect(
        this.mockFromAccount.setSignerWeights([this.signers[0], this.signers[1]], [1]),
      ).to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigMismatchedLength');
    });

    it('can remove signers and updates total weight', async function () {
      const removedSigner = this.signers[0].toLowerCase(); // weight = 1
      const weightBefore = await this.mock.totalWeight(this.mockAccount.address);

      // Remove signer
      await expect(this.mockFromAccount.removeSigners([removedSigner]))
        .to.emit(this.mock, 'ERC7913SignerRemoved')
        .withArgs(this.mockAccount.address, removedSigner);

      // Check weight was updated
      const weightAfter = await this.mock.totalWeight(this.mockAccount.address);
      expect(weightAfter).to.equal(weightBefore - 1n); // Should be decreased by removed signer's weight

      // Cannot remove non-existent signer
      await expect(this.mockFromAccount.removeSigners([removedSigner]))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigNonexistentSigner')
        .withArgs(removedSigner);
    });

    it('validates threshold is reachable when updating weights', async function () {
      // Increase threshold to match total weight
      const totalWeight = await this.mock.totalWeight(this.mockAccount.address);

      // Ensure totalWeight is what we expect (should be 6)
      expect(totalWeight).to.equal(6); // 1+2+3 after weights are properly set

      // Set threshold to total weight
      await this.mockFromAccount.setThreshold(totalWeight);

      // Now try to lower a weight, making total weight less than threshold
      await expect(this.mockFromAccount.setSignerWeights([this.signers[2]], [1])) // Change weight from 3 to 1
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigUnreachableThreshold')
        .withArgs(totalWeight - 2n, totalWeight); // Total weight would be 2 less than threshold
    });

    it('prevents removing signers if threshold becomes unreachable', async function () {
      // First check initial total weight
      const initialTotalWeight = await this.mock.totalWeight(this.mockAccount.address);
      expect(initialTotalWeight).to.equal(6); // 1+2+3

      // Set threshold to current total weight
      await this.mockFromAccount.setThreshold(initialTotalWeight);

      // Cannot remove a signer with weight > 0 as threshold would become unreachable
      await expect(this.mockFromAccount.removeSigners([this.signers[0]])) // Weight 1
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigUnreachableThreshold')
        .withArgs(initialTotalWeight - 1n, initialTotalWeight);
    });
  });

  describe('signature validation with weights', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    });

    it('validates signatures meeting threshold through combined weights', async function () {
      // Threshold is 3, signerECDSA1(weight=1) + signerECDSA2(weight=2) = 3, which equals threshold
      // Or just signerECDSA3(weight=3) alone is enough
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);

      // Try with exactly the threshold weight (1+2=3 = threshold 3)
      const exactSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2]));
      const exactSignature = await exactSigner.signMessage(testMessage);

      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, exactSignature)).to
        .eventually.be.true;

      // Also works with all signers (1+2+3=6 > threshold 3)
      const sufficientSignature = await this.multiSigner.signMessage(testMessage);

      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, sufficientSignature)).to
        .eventually.be.true;

      // Also try with just signerECDSA3 (weight 3) = 3, exactly meeting threshold
      const minimumSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA3]));
      const minimumSignature = await minimumSigner.signMessage(testMessage);

      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, minimumSignature)).to
        .eventually.be.true;
    });

    it('rejects signatures that collectively miss threshold', async function () {
      // Increase threshold to 4 (more than the default total of 3)
      await this.mockFromAccount.setThreshold(4);

      // Single signer with weight 1 is insufficient
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);
      const insufficientSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1]));
      const insufficientSignature = await insufficientSigner.signMessage(testMessage);

      // Should fail because total weight (1) < threshold (4)
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, insufficientSignature)).to
        .eventually.be.false;
    });

    it('considers weight changes when validating signatures', async function () {
      // Increase threshold to 4
      await this.mockFromAccount.setThreshold(4);

      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);

      // Create signer with just signerECDSA1 + signerECDSA2 (weight 1+2=3 < threshold 4)
      const insufficientSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2]));
      const insufficientSignature = await insufficientSigner.signMessage(testMessage);

      // First verify this combination is insufficient
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, insufficientSignature)).to
        .eventually.be.false;

      // Now increase the weight of signerECDSA2 to make it sufficient
      await this.mockFromAccount.setSignerWeights([this.signers[1]], [3]); // Now weight is 1+3=4 >= threshold 4

      // Same signature should now pass
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, insufficientSignature)).to
        .eventually.be.true;
    });

    it('rejects invalid signatures regardless of weight', async function () {
      // Even with a high weight, invalid signatures should be rejected
      await this.mockFromAccount.setSignerWeights([this.signers[0]], [10]); // Very high weight

      const testMessage = 'test';
      const differentMessage = 'different test';
      const messageHash = ethers.hashMessage(testMessage);

      // Sign the wrong message
      const invalidSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1]));
      const invalidSignature = await invalidSigner.signMessage(differentMessage);

      // Should fail because signature is invalid for the hash
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, invalidSignature)).to
        .eventually.be.false;
    });
  });
});
