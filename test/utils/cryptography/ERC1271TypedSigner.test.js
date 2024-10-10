const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { shouldBehaveLikeERC1271TypedSigner } = require('./ERC1271TypedSigner.behavior');
const { ECDSASigner, P256Signer, RSASigner } = require('../../helpers/signers');

async function fixture() {
  const ECDSA = new ECDSASigner();
  const ECDSAMock = await ethers.deployContract('ERC1271TypedSignerECDSA', [ECDSA.EOA.address]);

  const P256 = new P256Signer();
  const P256Mock = await ethers.deployContract('ERC1271TypedSignerP256', [P256.publicKey.qx, P256.publicKey.qy]);

  const RSA = new RSASigner();
  const RSAMock = await ethers.deployContract('ERC1271TypedSignerRSA', [RSA.publicKey.e, RSA.publicKey.n]);

  return {
    ECDSA,
    ECDSAMock,
    P256,
    P256Mock,
    RSA,
    RSAMock,
  };
}

describe('ERC1271TypedSigner', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('for an ECDSA signer', function () {
    beforeEach(function () {
      this.signer = this.ECDSA;
      this.mock = this.ECDSAMock;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for a P256 signer', function () {
    beforeEach(function () {
      this.signer = this.P256;
      this.mock = this.P256Mock;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for an RSA signer', function () {
    beforeEach(function () {
      this.signer = this.RSA;
      this.mock = this.RSAMock;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
