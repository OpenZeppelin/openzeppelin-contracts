const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { shouldBehaveLikeERC1271TypedSigner } = require('./ERC1271TypedSigner.behavior');
const { ECDSASigner, P256Signer, RSASigner } = require('../../helpers/signers');

async function fixture() {
  const ECDSA = new ECDSASigner();
  ECDSA.mock = await ethers.deployContract('ERC1271TypedSignerECDSA', [ECDSA.EOA.address]);

  const P256 = new P256Signer();
  P256.mock = await ethers.deployContract('ERC1271TypedSignerP256', [P256.publicKey.qx, P256.publicKey.qy]);

  const RSA = new RSASigner();
  RSA.mock = await ethers.deployContract('ERC1271TypedSignerRSA', [RSA.publicKey.e, RSA.publicKey.n]);

  return {
    ECDSA,
    P256,
    RSA,
  };
}

describe('ERC1271TypedSigner', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('for an ECDSA signer', function () {
    beforeEach(function () {
      this.signer = this.ECDSA;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for a P256 signer', function () {
    beforeEach(function () {
      this.signer = this.P256;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for an RSA signer', function () {
    beforeEach(function () {
      this.signer = this.RSA;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
