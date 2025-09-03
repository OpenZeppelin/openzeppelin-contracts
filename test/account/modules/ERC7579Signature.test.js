const { ethers, predeploy } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

const { impersonate } = require('../../helpers/account');
const { getDomain, PackedUserOperation } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');
const { MODULE_TYPE_VALIDATOR } = require('../../helpers/erc7579');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey } = require('../../helpers/signers');

const { shouldBehaveLikeERC7579Module, shouldBehaveLikeERC7579Validator } = require('./ERC7579Module.behavior');

// Prepare signers in advance (RSA are long to initialize)
const signerECDSA = ethers.Wallet.createRandom();
const signerP256 = new NonNativeSigner(P256SigningKey.random());
const signerRSA = new NonNativeSigner(RSASHA256SigningKey.random());

async function fixture() {
  const [other] = await ethers.getSigners();

  // Deploy ERC-7579 signature validator
  const mock = await ethers.deployContract('$ERC7579Signature');

  // ERC-7913 verifiers
  const verifierP256 = await ethers.deployContract('ERC7913P256Verifier');
  const verifierRSA = await ethers.deployContract('ERC7913RSAVerifier');

  // ERC-4337 env
  const helper = new ERC4337Helper();
  await helper.wait();
  const entrypointDomain = await getDomain(predeploy.entrypoint.v08);

  // ERC-7579 account
  const mockAccount = await helper.newAccount('$AccountERC7579');
  const mockFromAccount = await impersonate(mockAccount.address).then(asAccount => mock.connect(asAccount));

  return {
    moduleType: MODULE_TYPE_VALIDATOR,
    mock,
    verifierP256,
    verifierRSA,
    mockFromAccount,
    entrypointDomain,
    mockAccount,
    other,
  };
}

function prepareSigner(prototype) {
  this.signUserOp = userOp =>
    prototype.signTypedData
      .call(this.signer, this.entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));
}

describe('ERC7579Signature', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('reverts with ERC7579SignatureInvalidSignerLength when signer length is less than 20 bytes', async function () {
    const shortSigner = '0x0123456789'; // Less than 20 bytes
    await expect(this.mockFromAccount.onInstall(shortSigner)).to.be.revertedWithCustomError(
      this.mock,
      'ERC7579SignatureInvalidSignerLength',
    );
  });

  it('behaves as a noop when the validator is already installed for an account', async function () {
    // First installation should succeed
    const signerData = ethers.solidityPacked(['address'], [signerECDSA.address]);
    await expect(this.mockFromAccount.onInstall(signerData)).to.not.be.reverted;

    // Second installation should behave as a no-op
    await this.mockFromAccount.onInstall(ethers.solidityPacked(['address'], [ethers.Wallet.createRandom().address])); // Not revert
    await expect(this.mock.signer(this.mockAccount.address)).to.eventually.equal(signerData); // No change in signers
  });

  it('emits event on ERC7579SignatureSignerSet on both installation and uninstallation', async function () {
    const signerData = ethers.solidityPacked(['address'], [signerECDSA.address]);

    // First install
    await expect(this.mockFromAccount.onInstall(signerData))
      .to.emit(this.mock, 'ERC7579SignatureSignerSet')
      .withArgs(this.mockAccount.address, signerData);

    // Then uninstall
    await expect(this.mockFromAccount.onUninstall('0x'))
      .to.emit(this.mock, 'ERC7579SignatureSignerSet')
      .withArgs(this.mockAccount.address, '0x');
  });

  it('returns the correct signer bytes when set', async function () {
    // Starts empty
    await expect(this.mock.signer(this.mockAccount.address)).to.eventually.equal('0x');

    const signerData = ethers.solidityPacked(['address'], [signerECDSA.address]);
    await this.mockFromAccount.onInstall(signerData);

    await expect(this.mock.signer(this.mockAccount.address)).to.eventually.equal(signerData);
  });

  it('sets signer correctly with setSigner and emits event', async function () {
    const signerData = ethers.solidityPacked(['address'], [signerECDSA.address]);
    await expect(this.mockFromAccount.setSigner(signerData))
      .to.emit(this.mockFromAccount, 'ERC7579SignatureSignerSet')
      .withArgs(this.mockAccount.address, signerData);
    await expect(this.mock.signer(this.mockAccount.address)).to.eventually.equal(signerData);
  });

  it('reverts when calling setSigner with invalid signer length', async function () {
    await expect(this.mock.setSigner('0x0123456789')).to.be.revertedWithCustomError(
      this.mock,
      'ERC7579SignatureInvalidSignerLength',
    );
  });

  // ECDSA tested in ./ERC7579Validator.test.js

  describe('P256 key', function () {
    beforeEach(async function () {
      this.signer = signerP256;
      prepareSigner.call(this, new NonNativeSigner(this.signer.signingKey));
      this.installData = ethers.concat([
        this.verifierP256.target,
        this.signer.signingKey.publicKey.qx,
        this.signer.signingKey.publicKey.qy,
      ]);
    });

    shouldBehaveLikeERC7579Module();
    shouldBehaveLikeERC7579Validator();
  });

  describe('RSA key', function () {
    beforeEach(async function () {
      this.signer = signerRSA;
      prepareSigner.call(this, new NonNativeSigner(this.signer.signingKey));
      this.installData = ethers.concat([
        this.verifierRSA.target,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes'],
          [this.signer.signingKey.publicKey.e, this.signer.signingKey.publicKey.n],
        ),
      ]);
    });

    shouldBehaveLikeERC7579Module();
    shouldBehaveLikeERC7579Validator();
  });
});
