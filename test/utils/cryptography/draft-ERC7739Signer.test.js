const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeERC7739Signer } = require('./draft-ERC7739Signer.behavior');
const { ECDSASigner, P256Signer, RSASigner } = require('../../helpers/signers');

async function fixture() {
  const ECDSA = new ECDSASigner();
  const ECDSAMock = await ethers.deployContract('$ERC7739SignerECDSAMock', [ECDSA.EOA.address]);

  const P256 = new P256Signer();
  const P256Mock = await ethers.deployContract('$ERC7739SignerP256Mock', [P256.publicKey.qx, P256.publicKey.qy]);

  const RSA = new RSASigner();
  const RSAMock = await ethers.deployContract('$ERC7739SignerRSAMock', [RSA.publicKey.e, RSA.publicKey.n]);

  return {
    ECDSA,
    ECDSAMock,
    P256,
    P256Mock,
    RSA,
    RSAMock,
  };
}

describe('ERC7739Signer', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('for an ECDSA signer', function () {
    beforeEach(function () {
      this.signer = this.ECDSA;
      this.mock = this.ECDSAMock;
    });

    shouldBehaveLikeERC7739Signer();
  });

  describe('for a P256 signer', function () {
    beforeEach(function () {
      this.signer = this.P256;
      this.mock = this.P256Mock;
    });

    shouldBehaveLikeERC7739Signer();
  });

  describe('for an RSA signer', function () {
    beforeEach(function () {
      this.signer = this.RSA;
      this.mock = this.RSAMock;
    });

    shouldBehaveLikeERC7739Signer();
  });
});
