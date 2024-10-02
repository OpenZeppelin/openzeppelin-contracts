const { secp256k1 } = require('@noble/curves/secp256k1');
const { secp256r1 } = require('@noble/curves/p256');
const { generateKeyPairSync, privateEncrypt } = require('crypto');
const { ethers } = require('hardhat');

const ensureLowerOrderS = (N, { s, recovery, ...rest }) => {
  if (s > N / 2n) {
    s = N - s;
    recovery = 1 - recovery;
  }
  return { s, recovery, ...rest };
};

class ECDSASigner {
  N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

  constructor() {
    this._privateKey = secp256k1.utils.randomPrivateKey();
    this.publicKey = secp256k1.getPublicKey(this._privateKey, false);
  }

  signRaw(messageHash) {
    const sig = this._ensureLowerOrderS(secp256k1.sign(messageHash.replace(/0x/, ''), this._privateKey));
    return ethers.Signature.from({
      r: sig.r,
      v: sig.recovery + 27,
      s: sig.s,
    }).serialized;
  }

  get EOA() {
    return new ethers.Wallet(ethers.hexlify(this._privateKey));
  }

  _ensureLowerOrderS({ s, recovery, ...rest }) {
    return ensureLowerOrderS(this.N, { s, recovery, ...rest });
  }
}

class P256Signer {
  N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

  constructor() {
    this._privateKey = secp256r1.utils.randomPrivateKey();
    const [qx, qy] = [
      secp256r1.getPublicKey(this._privateKey, false).slice(0x01, 0x21),
      secp256r1.getPublicKey(this._privateKey, false).slice(0x21, 0x41),
    ].map(ethers.hexlify);
    this.publicKey = {
      qx,
      qy,
    };
  }

  signRaw(messageHash) {
    const sig = this._ensureLowerOrderS(secp256r1.sign(messageHash.replace(/0x/, ''), this._privateKey));
    return ethers.Signature.from({
      r: sig.r,
      v: sig.recovery + 27,
      s: sig.s,
    }).serialized;
  }

  _ensureLowerOrderS({ s, recovery, ...rest }) {
    return ensureLowerOrderS(this.N, { s, recovery, ...rest });
  }
}

class RSASigner {
  constructor() {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const jwk = keyPair.publicKey.export({ format: 'jwk' });
    const [e, n] = [jwk.e, jwk.n].map(ethers.decodeBase64);
    this._privateKey = keyPair.privateKey;
    this.publicKey = { e, n };
  }

  signRaw(messageHash) {
    // SHA256 OID = 608648016503040201 (9 bytes) | NULL = 0500 (2 bytes) (explicit) | OCTET_STRING length (0x20) = 0420 (2 bytes)
    const dataToSign = ethers.concat(['0x3031300d060960864801650304020105000420', messageHash]);
    return '0x' + privateEncrypt(this._privateKey, ethers.getBytes(dataToSign)).toString('hex');
  }
}

module.exports = {
  ECDSASigner,
  P256Signer,
  RSASigner,
};
