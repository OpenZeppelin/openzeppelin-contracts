const {
  AbstractSigner,
  Signature,
  TypedDataEncoder,
  assert,
  assertArgument,
  concat,
  dataLength,
  decodeBase64,
  getBytes,
  getBytesCopy,
  hashMessage,
  hexlify,
  sha256,
  toBeHex,
  keccak256,
  toBigInt,
} = require('ethers');
const { secp256r1 } = require('@noble/curves/p256');
const { generateKeyPairSync, privateEncrypt } = require('crypto');
const { AbiCoder } = require('ethers');

// Lightweight version of BaseWallet
class NonNativeSigner extends AbstractSigner {
  #signingKey;

  constructor(privateKey, provider) {
    super(provider);
    assertArgument(
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
    return this.signingKey.sign(hashMessage(message)).serialized;
  }

  async signTypedData(
    domain /*: TypedDataDomain*/,
    types /*: Record<string, Array<TypedDataField>>*/,
    value /*: Record<string, any>*/,
  ) /*: Promise<string>*/ {
    // Populate any ENS names
    const populated = await TypedDataEncoder.resolveNames(domain, types, value, async name => {
      assert(this.provider != null, 'cannot resolve ENS names without a provider', 'UNSUPPORTED_OPERATION', {
        operation: 'resolveName',
        info: { name },
      });
      const address = await this.provider.resolveName(name);
      assert(address != null, 'unconfigured ENS name', 'UNCONFIGURED_NAME', { value: name });
      return address;
    });

    return this.signingKey.sign(TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized;
  }
}

class P256SigningKey {
  #privateKey;

  constructor(privateKey) {
    this.#privateKey = getBytes(privateKey);
  }

  static random() {
    return new this(secp256r1.utils.randomPrivateKey());
  }

  get privateKey() {
    return hexlify(this.#privateKey);
  }

  get publicKey() {
    const publicKeyBytes = secp256r1.getPublicKey(this.#privateKey, false);
    return { qx: hexlify(publicKeyBytes.slice(0x01, 0x21)), qy: hexlify(publicKeyBytes.slice(0x21, 0x41)) };
  }

  sign(digest /*: BytesLike*/) /*: Signature*/ {
    assertArgument(dataLength(digest) === 32, 'invalid digest length', 'digest', digest);

    const sig = secp256r1.sign(getBytesCopy(digest), getBytesCopy(this.#privateKey), { lowS: true });

    return Signature.from({ r: toBeHex(sig.r, 32), s: toBeHex(sig.s, 32), v: sig.recovery ? 0x1c : 0x1b });
  }
}

class RSASigningKey {
  #privateKey;
  #publicKey;

  constructor(keyPair) {
    const jwk = keyPair.publicKey.export({ format: 'jwk' });
    this.#privateKey = keyPair.privateKey;
    this.#publicKey = { e: decodeBase64(jwk.e), n: decodeBase64(jwk.n) };
  }

  static random(modulusLength = 2048) {
    return new this(generateKeyPairSync('rsa', { modulusLength }));
  }

  get privateKey() {
    return hexlify(this.#privateKey);
  }

  get publicKey() {
    return { e: hexlify(this.#publicKey.e), n: hexlify(this.#publicKey.n) };
  }

  sign(digest /*: BytesLike*/) /*: Signature*/ {
    assertArgument(dataLength(digest) === 32, 'invalid digest length', 'digest', digest);
    // SHA256 OID = 608648016503040201 (9 bytes) | NULL = 0500 (2 bytes) (explicit) | OCTET_STRING length (0x20) = 0420 (2 bytes)
    return {
      serialized: hexlify(
        privateEncrypt(this.#privateKey, getBytes(concat(['0x3031300d060960864801650304020105000420', digest]))),
      ),
    };
  }
}

class RSASHA256SigningKey extends RSASigningKey {
  sign(digest /*: BytesLike*/) /*: Signature*/ {
    assertArgument(dataLength(digest) === 32, 'invalid digest length', 'digest', digest);
    return super.sign(sha256(getBytes(digest)));
  }
}

class MultiERC7913SigningKey {
  #signers;
  #weights;

  constructor(signers, weights = null) {
    assertArgument(
      Array.isArray(signers) && signers.length > 0,
      'signers must be a non-empty array',
      'signers',
      signers.length,
    );

    if (weights !== null) {
      assertArgument(
        Array.isArray(weights) && weights.length === signers.length,
        'weights must be an array with the same length as signers',
        'weights',
        weights.length,
      );
    }

    this.#signers = signers;
    this.#weights = weights;
  }

  get signers() {
    return this.#signers;
  }

  get weights() {
    return this.#weights;
  }

  sign(digest /*: BytesLike*/ /*: Signature*/) {
    assertArgument(dataLength(digest) === 32, 'invalid digest length', 'digest', digest);

    const sortedSigners = this.#signers
      .map(signer => {
        const signerBytes = typeof signer.address === 'string' ? signer.address : signer.bytes;

        const id = keccak256(signerBytes);
        return {
          id,
          signer: signerBytes,
          signature: signer.signingKey.sign(digest).serialized,
        };
      })
      .sort((a, b) => (toBigInt(a.id) < toBigInt(b.id) ? -1 : 1));

    return {
      serialized: AbiCoder.defaultAbiCoder().encode(
        ['bytes[]', 'bytes[]'],
        [sortedSigners.map(p => p.signer), sortedSigners.map(p => p.signature)],
      ),
    };
  }
}

module.exports = { NonNativeSigner, P256SigningKey, RSASigningKey, RSASHA256SigningKey, MultiERC7913SigningKey };
