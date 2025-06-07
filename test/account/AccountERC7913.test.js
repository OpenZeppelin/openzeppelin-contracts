const { ethers, entrypoint } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../helpers/eip712');
const { ERC4337Helper } = require('../helpers/erc4337');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey } = require('../helpers/signers');
const { PackedUserOperation } = require('../helpers/eip712-types');

const { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } = require('./Account.behavior');
const { shouldBehaveLikeERC1271 } = require('../utils/cryptography/ERC1271.behavior');
const { shouldBehaveLikeERC7821 } = require('./extensions/ERC7821.behavior');

// Prepare signer in advance (RSA are long to initialize)
const signerECDSA = ethers.Wallet.createRandom();
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
  const entrypointDomain = await getDomain(entrypoint.v08);
  const domain = { name: 'AccountERC7913', version: '1', chainId: entrypointDomain.chainId }; // Missing verifyingContract,

  const makeMock = signer =>
    helper.newAccount('$AccountERC7913Mock', ['AccountERC7913', '1', signer]).then(mock => {
      domain.verifyingContract = mock.address;
      return mock;
    });

  const signUserOp = function (userOp) {
    return this.signer
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));
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
  };
}

describe('AccountERC7913', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  // Using ECDSA key as verifier
  describe('ECDSA key', function () {
    beforeEach(async function () {
      this.signer = signerECDSA;
      this.mock = await this.makeMock(this.signer.address);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  // Using P256 key with an ERC-7913 verifier
  describe('P256 key', function () {
    beforeEach(async function () {
      this.signer = signerP256;
      this.mock = await this.makeMock(
        ethers.concat([
          this.verifierP256.target,
          this.signer.signingKey.publicKey.qx,
          this.signer.signingKey.publicKey.qy,
        ]),
      );
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  // Using RSA key with an ERC-7913 verifier
  describe('RSA key', function () {
    beforeEach(async function () {
      this.signer = signerRSA;
      this.mock = await this.makeMock(
        ethers.concat([
          this.verifierRSA.target,
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes', 'bytes'],
            [this.signer.signingKey.publicKey.e, this.signer.signingKey.publicKey.n],
          ),
        ]),
      );
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });
});
