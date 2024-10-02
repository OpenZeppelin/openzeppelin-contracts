const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { shouldBehaveLikeERC1271TypedSigner } = require('./ERC1271TypedSigner.behavior');
const { getDomain } = require('../../helpers/eip712');
const { ECDSASigner, P256Signer, RSASigner } = require('../../helpers/signers');

async function fixture() {
  const _ECDSASigner = new ECDSASigner();
  const ECDSAMock = await ethers.deployContract('ERC1271TypedSignerECDSA', [_ECDSASigner.EOA.address]);

  const _P256Signer = new P256Signer();
  const P256Mock = await ethers.deployContract('ERC1271TypedSignerP256', [
    _P256Signer.publicKey.qx,
    _P256Signer.publicKey.qy,
  ]);

  const _RSASigner = new RSASigner();
  const RSAMock = await ethers.deployContract('ERC1271TypedSignerRSA', [
    _RSASigner.publicKey.e,
    _RSASigner.publicKey.n,
  ]);
  return { ECDSAMock, ECDSASigner: _ECDSASigner, P256Mock, P256Signer: _P256Signer, RSAMock, RSASigner: _RSASigner };
}

describe('ERC1271TypedSigner', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('for an ECDSA signer', function () {
    beforeEach(async function () {
      this.mock = this.ECDSAMock;
      this.domain = await getDomain(this.ECDSAMock);
      this.signer = this.ECDSASigner;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for a P256 signer', function () {
    beforeEach(async function () {
      this.mock = this.P256Mock;
      this.domain = await getDomain(this.P256Mock);
      this.signer = this.P256Signer;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for an RSA signer', function () {
    beforeEach(async function () {
      this.mock = this.RSAMock;
      this.domain = await getDomain(this.RSAMock);
      this.signer = this.RSASigner;
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
