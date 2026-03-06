import { network } from 'hardhat';
import { getDomain } from '../helpers/eip712';
import { ERC4337Helper } from '../helpers/erc4337';
import { PackedUserOperation } from '../helpers/eip712-types';
import { NonNativeSigner, P256SigningKey, RSASHA256SigningKey, WebAuthnSigningKey } from '../helpers/signers';
import { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } from './Account.behavior';
import { shouldBehaveLikeERC1271 } from '../utils/cryptography/ERC1271.behavior';
import { shouldBehaveLikeERC7821 } from './extensions/ERC7821.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

// Prepare signer in advance (RSA are long to initialize)
const signerECDSA = ethers.Wallet.createRandom();
const signerP256 = new NonNativeSigner(P256SigningKey.random());
const signerRSA = new NonNativeSigner(RSASHA256SigningKey.random());
const signerWebAuthn = new NonNativeSigner(WebAuthnSigningKey.random());

// Minimal fixture common to the different signer verifiers
async function fixture() {
  // EOAs and environment
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-7913 verifiers
  const verifierP256 = await ethers.deployContract('ERC7913P256Verifier');
  const verifierRSA = await ethers.deployContract('ERC7913RSAVerifier');
  const verifierWebAuthn = await ethers.deployContract('ERC7913WebAuthnVerifier');

  // ERC-4337 env
  const helper = new ERC4337Helper(connection);
  await helper.wait();
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);
  const domain = { name: 'AccountERC7913', version: '1', chainId: entrypointDomain.chainId }; // Missing verifyingContract,

  const makeMock = signer =>
    helper.newAccount('$AccountERC7913Mock', [signer, 'AccountERC7913', '1']).then(mock => {
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
    verifierWebAuthn,
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
    Object.assign(this, connection, await loadFixture(fixture));
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

  // Using WebAuthn key with an ERC-7913 verifier
  describe('WebAuthn key', function () {
    beforeEach(async function () {
      this.signer = signerWebAuthn;
      this.mock = await this.makeMock(
        ethers.concat([
          this.verifierWebAuthn.target,
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
});
