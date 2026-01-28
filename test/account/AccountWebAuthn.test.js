import { network } from 'hardhat';
import { getDomain } from '../helpers/eip712';
import { ERC4337Helper } from '../helpers/erc4337';
import { PackedUserOperation } from '../helpers/eip712-types';
import { NonNativeSigner, P256SigningKey, WebAuthnSigningKey } from '../helpers/signers';
import { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } from './Account.behavior';
import { shouldBehaveLikeERC1271 } from '../utils/cryptography/ERC1271.behavior';
import { shouldBehaveLikeERC7821 } from './extensions/ERC7821.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

const webAuthnSigner = new NonNativeSigner(WebAuthnSigningKey.random());
const p256Signer = new NonNativeSigner(P256SigningKey.random());

async function fixture() {
  // EOAs and environment
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 account
  const helper = new ERC4337Helper(connection);

  const webAuthnMock = await helper.newAccount('$AccountWebAuthnMock', [
    webAuthnSigner.signingKey.publicKey.qx,
    webAuthnSigner.signingKey.publicKey.qy,
    'AccountWebAuthn',
    '1',
  ]);

  const p256Mock = await helper.newAccount('$AccountWebAuthnMock', [
    p256Signer.signingKey.publicKey.qx,
    p256Signer.signingKey.publicKey.qy,
    'AccountWebAuthn',
    '1',
  ]);

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);

  // domain cannot be fetched using getDomain(mock) before the mock is deployed
  const domain = {
    name: 'AccountWebAuthn',
    version: '1',
    chainId: entrypointDomain.chainId,
  };

  // Sign userOp with the active signer
  const signUserOp = function (userOp) {
    return this.signer
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));
  };

  return { helper, domain, webAuthnMock, p256Mock, target, beneficiary, other, signUserOp };
}

describe('AccountWebAuthn', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  describe('WebAuthn Assertions', function () {
    beforeEach(async function () {
      this.signer = webAuthnSigner;
      this.mock = this.webAuthnMock;
      this.domain.verifyingContract = this.mock.address;
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });

  describe('as regular P256 validator', function () {
    beforeEach(async function () {
      this.signer = p256Signer;
      this.mock = this.p256Mock;
      this.domain.verifyingContract = this.mock.address;
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC1271({ erc7739: true });
    shouldBehaveLikeERC7821();
  });
});
