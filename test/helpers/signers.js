const { ethers } = require('ethers');
const { secp256r1 } = require('@noble/curves/p256');
const { generateKeyPairSync, privateEncrypt } = require('crypto');

// Lightweight version of BaseWallet
class NonNativeSigner extends ethers.AbstractSigner {
  #signingKey;

  constructor(privateKey, provider) {
    super(provider);
    ethers.assertArgument(
      privateKey && typeof privateKey.sign === 'function',
      'invalid private key',
      'privateKey',
      '[ REDACTED ]',
    );
    this.#signingKey = privateKey;
  }

  get signingKey() {
    return this.#signingKey;
  }
  get privateKey() {
    return this.signingKey.privateKey;
  }

  async getAddress() {
    throw new Error("NonNativeSigner doesn't have an address");
  }

  connect(provider) {
    return new NonNativeSigner(this.#signingKey, provider);
  }

  async signTransaction(/*tx: TransactionRequest*/) {
    throw new Error('NonNativeSigner cannot send transactions');
  }

  async signMessage(message /*: string | Uint8Array*/) /*: Promise<string>*/ {
    return this.signingKey.sign(ethers.hashMessage(message)).serialized;
  }

  async signTypedData(
    domain /*: TypedDataDomain*/,
    types /*: Record<string, Array<TypedDataField>>*/,
    value /*: Record<string, any>*/,
  ) /*: Promise<string>*/ {
    // Populate any ENS names
    const populated = await ethers.TypedDataEncoder.resolveNames(domain, types, value, async name => {
      ethers.assert(this.provider != null, 'cannot resolve ENS names without a provider', 'UNSUPPORTED_OPERATION', {
        operation: 'resolveName',
        info: { name },
      });
      const address = await this.provider.resolveName(name);
      ethers.assert(address != null, 'unconfigured ENS name', 'UNCONFIGURED_NAME', { value: name });
      return address;
    });

    return this.signingKey.sign(ethers.TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized;
  }
}

class P256SigningKey {
  #privateKey;

  constructor(privateKey) {
    this.#privateKey = ethers.getBytes(privateKey);
  }

  static random() {
    return new this(secp256r1.utils.randomPrivateKey());
  }

  get privateKey() {
    return ethers.hexlify(this.#privateKey);
  }

  get publicKey() {
    const publicKeyBytes = secp256r1.getPublicKey(this.#privateKey, false);
    return {
      qx: ethers.hexlify(publicKeyBytes.slice(0x01, 0x21)),
      qy: ethers.hexlify(publicKeyBytes.slice(0x21, 0x41)),
    };
  }

  sign(digest /*: BytesLike*/) /*: ethers.Signature*/ {
    ethers.assertArgument(ethers.dataLength(digest) === 32, 'invalid digest length', 'digest', digest);

    const sig = secp256r1.sign(ethers.getBytesCopy(digest), ethers.getBytesCopy(this.#privateKey), { lowS: true });

    return ethers.Signature.from({
      r: ethers.toBeHex(sig.r, 32),
      s: ethers.toBeHex(sig.s, 32),
      v: sig.recovery ? 0x1c : 0x1b,
    });
  }
}

class RSASigningKey {
  #privateKey;
  #publicKey;

  constructor(keyPair) {
    const jwk = keyPair.publicKey.export({ format: 'jwk' });
    this.#privateKey = keyPair.privateKey;
    this.#publicKey = { e: ethers.decodeBase64(jwk.e), n: ethers.decodeBase64(jwk.n) };
  }

  static random(modulusLength = 2048) {
    return new this(generateKeyPairSync('rsa', { modulusLength }));
  }

  get privateKey() {
    return ethers.hexlify(this.#privateKey);
  }

  get publicKey() {
    return { e: ethers.hexlify(this.#publicKey.e), n: ethers.hexlify(this.#publicKey.n) };
  }

  sign(digest /*: BytesLike*/) /*: ethers.Signature*/ {
    ethers.assertArgument(ethers.dataLength(digest) === 32, 'invalid digest length', 'digest', digest);
    // SHA256 OID = 608648016503040201 (9 bytes) | NULL = 0500 (2 bytes) (explicit) | OCTET_STRING length (0x20) = 0420 (2 bytes)
    return {
      serialized: ethers.hexlify(
        privateEncrypt(
          this.#privateKey,
          ethers.getBytes(ethers.concat(['0x3031300d060960864801650304020105000420', digest])),
        ),
      ),
    };
  }
}

class RSASHA256SigningKey extends RSASigningKey {
  sign(digest /*: BytesLike*/) /*: ethers.Signature*/ {
    ethers.assertArgument(ethers.dataLength(digest) === 32, 'invalid digest length', 'digest', digest);
    return super.sign(ethers.sha256(ethers.getBytes(digest)));
  }
}

class WebAuthnSigningKey extends P256SigningKey {
  sign(digest /*: BytesLike*/) /*: { serialized: string } */ {
    ethers.assertArgument(ethers.dataLength(digest) === 32, 'invalid digest length', 'digest', digest);

    const clientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge: ethers.encodeBase64(digest).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''),
    });

    // Flags 0x05 = AUTH_DATA_FLAGS_UP | AUTH_DATA_FLAGS_UV
    const authenticatorData = ethers.solidityPacked(
      ['bytes32', 'bytes1', 'bytes4'],
      [ethers.ZeroHash, '0x05', '0x00000000'],
    );

    // Regular P256 signature
    const { r, s } = super.sign(
      ethers.sha256(ethers.concat([authenticatorData, ethers.sha256(ethers.toUtf8Bytes(clientDataJSON))])),
    );

    const serialized = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes', 'string'],
      [
        r,
        s,
        clientDataJSON.indexOf('"challenge"'),
        clientDataJSON.indexOf('"type"'),
        authenticatorData,
        clientDataJSON,
      ],
    );

    return { serialized };
  }
}

class MultiERC7913SigningKey {
  // this is a sorted array of objects that contain {signer, weight}
  #signers;

  constructor(signers) {
    ethers.assertArgument(
      Array.isArray(signers) && signers.length > 0,
      'signers must be a non-empty array',
      'signers',
      signers.length,
    );

    // Sorting is done at construction so that it doesn't have to be done in sign()
    this.#signers = signers.sort(
      (s1, s2) => ethers.keccak256(s1.bytes ?? s1.address) - ethers.keccak256(s2.bytes ?? s2.address),
    );
  }

  get signers() {
    return this.#signers;
  }

  sign(digest /*: BytesLike*/ /*: ethers.Signature*/) {
    ethers.assertArgument(ethers.dataLength(digest) === 32, 'invalid digest length', 'digest', digest);

    return {
      serialized: ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes[]', 'bytes[]'],
        [
          this.#signers.map(signer => signer.bytes ?? signer.address),
          this.#signers.map(signer => signer.signingKey.sign(digest).serialized),
        ],
      ),
    };
  }
}

module.exports = {
  NonNativeSigner,
  P256SigningKey,
  RSASigningKey,
  RSASHA256SigningKey,
  WebAuthnSigningKey,
  MultiERC7913SigningKey,
};
