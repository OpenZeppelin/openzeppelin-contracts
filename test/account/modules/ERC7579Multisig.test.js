const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { ERC4337Helper } = require('../../helpers/erc4337');
const {
  MODULE_TYPE_EXECUTOR,
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
  // Deploy ERC-7579 multisig module
  const mock = await ethers.deployContract('$ERC7579MultisigExecutorMock', ['MultisigExecutor', '1']);
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();

  // Prepare signers
  const signers = [signerECDSA1.address, signerECDSA2.address];
  const threshold = 1;
  const multiSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1, signerECDSA2]));

  // Prepare module installation data
  const installData = ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'uint256'], [signers, threshold]);

  // ERC-7579 account
  const mockAccount = await helper.newAccount('$AccountERC7579');
  const mockFromAccount = await impersonate(mockAccount.address).then(asAccount => mock.connect(asAccount));
  const mockAccountFromEntrypoint = await impersonate(predeploy.entrypoint.v08.target).then(asEntrypoint =>
    mockAccount.connect(asEntrypoint),
  );

  const moduleType = MODULE_TYPE_EXECUTOR;

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
    threshold,
    multiSigner,
  };
}

describe('ERC7579Multisig', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC7579Module();

  it('sets initial signers and threshold on installation', async function () {
    const tx = await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);

    for (const signer of this.signers) {
      await expect(tx)
        .to.emit(this.mock, 'ERC7913SignerAdded')
        .withArgs(this.mockAccount.address, signer.toLowerCase());
    }

    await expect(tx).to.emit(this.mock, 'ERC7913ThresholdSet').withArgs(this.mockAccount.address, this.threshold);

    // Verify signers and threshold
    await expect(this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64)).to.eventually.deep.equal(this.signers);
    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(this.threshold);

    // onInstall is allowed again but is a noop
    await this.mockFromAccount.onInstall(
      ethers.AbiCoder.defaultAbiCoder().encode(['bytes[]', 'uint256'], [[signerECDSA3.address], 2]),
    );

    // Should still have the original signers and threshold
    await expect(this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64)).to.eventually.deep.equal(this.signers);
    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(this.threshold);
  });

  it('cleans up signers and threshold on uninstallation', async function () {
    await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    await this.mockAccountFromEntrypoint.uninstallModule(this.moduleType, this.mock.target, '0x');

    // Verify signers and threshold are cleared
    await expect(this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64)).to.eventually.deep.equal([]);
    await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(0);
  });

  describe('signer management', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    });

    it('reverts adding an invalid signer', async function () {
      await expect(this.mockFromAccount.addSigners(['0x1234']))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigInvalidSigner')
        .withArgs('0x1234');
    });

    it('can add signers', async function () {
      const newSigners = [signerECDSA3.address];

      // Get signers before adding
      const signersBefore = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Add new signers
      const tx = await this.mockFromAccount.addSigners(newSigners);
      for (const signer of newSigners) {
        await expect(tx)
          .to.emit(this.mock, 'ERC7913SignerAdded')
          .withArgs(this.mockAccount.address, signer.toLowerCase());
      }

      // Get signers after adding
      const signersAfter = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Check that new signers were added
      expect(signersAfter.length).to.equal(signersBefore.length + 1);
      expect(signersAfter.map(ethers.getAddress)).to.include(ethers.getAddress(signerECDSA3.address));

      // Verify isSigner function
      await expect(this.mock.isSigner(this.mockAccount.address, signerECDSA3.address)).to.eventually.be.true;

      // Reverts if the signer already exists
      await expect(this.mockFromAccount.addSigners(newSigners))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigAlreadyExists')
        .withArgs(signerECDSA3.address.toLowerCase());
    });

    it('can remove signers', async function () {
      const removedSigners = [signerECDSA1.address].map(address => address.toLowerCase());

      // Get signers before removing
      const signersBefore = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Remove signers
      const tx = await this.mockFromAccount.removeSigners(removedSigners);
      for (const signer of removedSigners) {
        await expect(tx)
          .to.emit(this.mock, 'ERC7913SignerRemoved')
          .withArgs(this.mockAccount.address, signer.toLowerCase());
      }

      // Get signers after removing
      const signersAfter = await this.mock.getSigners(this.mockAccount.address, 0, MAX_UINT64);

      // Check that signers were removed
      expect(signersAfter.length).to.equal(signersBefore.length - 1);
      expect(signersAfter).to.not.include(signerECDSA1.address);

      // Verify isSigner function
      await expect(this.mock.isSigner(this.mockAccount.address, signerECDSA1.address)).to.eventually.be.false;

      // Reverts if the signer doesn't exist
      await expect(this.mockFromAccount.removeSigners(removedSigners))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigNonexistentSigner')
        .withArgs(signerECDSA1.address.toLowerCase());

      // Reverts if threshold becomes unreachable after removal
      await this.mockFromAccount.setThreshold(1);
      await expect(this.mockFromAccount.removeSigners([signerECDSA2.address]))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigUnreachableThreshold')
        .withArgs(0, 1);
    });

    it('can set threshold', async function () {
      // Set threshold to 2
      await expect(this.mockFromAccount.setThreshold(2))
        .to.emit(this.mock, 'ERC7913ThresholdSet')
        .withArgs(this.mockAccount.address, 2);

      // Verify threshold
      await expect(this.mock.threshold(this.mockAccount.address)).to.eventually.equal(2);

      // Reverts if threshold is unreachable
      await expect(this.mockFromAccount.setThreshold(3))
        .to.be.revertedWithCustomError(this.mock, 'ERC7579MultisigUnreachableThreshold')
        .withArgs(2, 3);
    });
  });

  describe('signature validation', function () {
    beforeEach(async function () {
      await this.mockAccountFromEntrypoint.installModule(this.moduleType, this.mock.target, this.installData);
    });

    it('validates multiple signatures meeting threshold', async function () {
      // Set threshold to 2
      await this.mockFromAccount.setThreshold(2);

      // Create hash and sign it
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);
      const multiSignature = await this.multiSigner.signMessage(testMessage);
      // Should succeed with valid signatures meeting threshold
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, multiSignature)).to
        .eventually.be.true;
    });

    it('rejects signatures not meeting threshold', async function () {
      // First set threshold to 2
      await this.mockFromAccount.setThreshold(2);

      // Create MultiERC7913SigningKey with one authorized signer
      const multiSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1]));

      // Create hash and sign it
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);
      const multiSignature = await multiSigner.signMessage(testMessage);

      // Should fail because threshold is 2 but only 1 signature provided
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, multiSignature)).to
        .eventually.be.false;
    });

    it('validates valid signatures meeting threshold', async function () {
      // Create MultiERC7913SigningKey with one authorized signer
      const multiSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA1]));

      // Create hash and sign it
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);
      const multiSignature = await multiSigner.signMessage(testMessage);

      // Should succeed with valid signature meeting threshold
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, multiSignature)).to
        .eventually.be.true;
    });

    it('rejects signatures from unauthorized signers', async function () {
      // Create MultiERC7913SigningKey with unauthorized signer
      const multiSigner = new NonNativeSigner(new MultiERC7913SigningKey([signerECDSA4]));

      // Create hash and sign it
      const testMessage = 'test';
      const messageHash = ethers.hashMessage(testMessage);
      const multiSignature = await multiSigner.signMessage(testMessage);

      // Should fail because signer is not authorized
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, multiSignature)).to
        .eventually.be.false;
    });

    it('rejects invalid signatures from authorized signers', async function () {
      // Create hash and sign it with a different message
      const testMessage = 'test';
      const differentMessage = 'different test';
      const messageHash = ethers.hashMessage(testMessage);
      const multiSignature = await this.multiSigner.signMessage(differentMessage);

      // Should fail because signature is for a different hash
      await expect(this.mock.$_rawERC7579Validation(this.mockAccount.address, messageHash, multiSignature)).to
        .eventually.be.false;
    });
  });
});
