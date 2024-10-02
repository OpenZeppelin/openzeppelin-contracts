const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ethers } = require('hardhat');
const { generateKeyPairSync, createSign, privateEncrypt } = require('crypto');
const { secp256r1 } = require('@noble/curves/p256');
const { secp256k1 } = require('@noble/curves/secp256k1');
const { shouldBehaveLikeERC1271TypedSigner } = require('./ERC1271TypedSigner.behavior');
const { getDomain } = require('../../helpers/eip712');

const secpk256k1N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const P256N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

const ensureLowerOrderS = (N, { s, recovery, ...rest }) => {
  if (s > N / 2n) {
    s = N - s;
    recovery = 1 - recovery;
  }
  return { s, recovery, ...rest };
};

async function fixture() {
  const seckp256k1Key = secp256k1.utils.randomPrivateKey();
  const ECDSASigner = {
    privateKey: seckp256k1Key,
    publicKey: secp256k1.getPublicKey(seckp256k1Key, false),
  };
  const ECDSAMock = await ethers.deployContract('ERC1271TypedSignerECDSA', [
    new ethers.Wallet(ethers.hexlify(ECDSASigner.privateKey)).address,
  ]);

  const P256Key = secp256r1.utils.randomPrivateKey();
  const P256Signer = {
    privateKey: P256Key,
    publicKey: [
      secp256r1.getPublicKey(P256Key, false).slice(0x01, 0x21),
      secp256r1.getPublicKey(P256Key, false).slice(0x21, 0x41),
    ].map(ethers.hexlify),
  };
  const P256Mock = await ethers.deployContract('ERC1271TypedSignerP256', [
    P256Signer.publicKey[0],
    P256Signer.publicKey[1],
  ]);

  const RSASigner = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = RSASigner.publicKey.export({ format: 'jwk' });
  const RSAMock = await ethers.deployContract('ERC1271TypedSignerRSA', [jwk.e, jwk.n].map(ethers.decodeBase64));
  return { ECDSAMock, ECDSASigner, P256Mock, P256Signer, RSAMock, RSASigner };
}

describe('ERC1271TypedSigner', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('for an ECDSA signer', function () {
    beforeEach(async function () {
      this.mock = this.ECDSAMock;
      this.domain = await getDomain(this.ECDSAMock);
      this.signRaw = async contents => {
        const sig = ensureLowerOrderS(
          secpk256k1N,
          secp256k1.sign(contents.replace(/0x/, ''), this.ECDSASigner.privateKey),
        );
        return ethers.Signature.from({
          r: sig.r,
          v: sig.recovery + 27,
          s: sig.s,
        }).serialized;
      };
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for a P256 signer', function () {
    beforeEach(async function () {
      this.mock = this.P256Mock;
      this.domain = await getDomain(this.P256Mock);
      this.signRaw = async contents => {
        const sig = ensureLowerOrderS(P256N, secp256r1.sign(contents.replace(/0x/, ''), this.P256Signer.privateKey));
        return ethers.Signature.from({
          r: sig.r,
          v: sig.recovery + 27,
          s: sig.s,
        }).serialized;
      };
    });

    shouldBehaveLikeERC1271TypedSigner();
  });

  describe('for an RSA signer', function () {
    beforeEach(async function () {
      this.mock = this.RSAMock;
      this.domain = await getDomain(this.RSAMock);
      this.signRaw = async contents => {
        const sign = createSign('SHA256');
        sign.update(ethers.toUtf8Bytes(contents));
        sign.end();
        const dataToSign = ethers.concat(['0x3031300d060960864801650304020105000420', contents]);
        return '0x' + privateEncrypt(this.RSASigner.privateKey, ethers.getBytes(dataToSign)).toString('hex');
      };
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
