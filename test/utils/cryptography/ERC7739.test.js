const { ethers } = require('hardhat');
const { shouldBehaveLikeERC1271 } = require('./ERC1271.behavior');
const { NonNativeSigner, P256SigningKey, RSASHA256SigningKey } = require('../../helpers/signers');

describe('ERC7739', function () {
  describe('for an ECDSA signer', function () {
    before(async function () {
      this.signer = ethers.Wallet.createRandom();
      this.mock = await ethers.deployContract('ERC7739ECDSAMock', [this.signer.address]);
    });

    shouldBehaveLikeERC1271({ erc7739: true });
  });

  describe('for a P256 signer', function () {
    before(async function () {
      this.signer = new NonNativeSigner(P256SigningKey.random());
      this.mock = await ethers.deployContract('ERC7739P256Mock', [
        this.signer.signingKey.publicKey.qx,
        this.signer.signingKey.publicKey.qy,
      ]);
    });

    shouldBehaveLikeERC1271({ erc7739: true });
  });

  describe('for an RSA signer', function () {
    before(async function () {
      this.signer = new NonNativeSigner(RSASHA256SigningKey.random());
      this.mock = await ethers.deployContract('ERC7739RSAMock', [
        this.signer.signingKey.publicKey.e,
        this.signer.signingKey.publicKey.n,
      ]);
    });

    shouldBehaveLikeERC1271({ erc7739: true });
  });
});
