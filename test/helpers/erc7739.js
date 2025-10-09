const { ethers } = require('hardhat');
const { formatType } = require('./eip712');

const PersonalSign = formatType({ prefixed: 'bytes' });
const TypedDataSign = contentsTypeName =>
  formatType({
    contents: contentsTypeName,
    name: 'string',
    version: 'string',
    chainId: 'uint256',
    verifyingContract: 'address',
    salt: 'bytes32',
  });

class ERC7739Signer extends ethers.AbstractSigner {
  #signer;
  #domain;

  constructor(signer, domain) {
    super(signer.provider);
    this.#signer = signer;
    this.#domain = domain;
  }

  static from(signer, domain) {
    return new this(signer, domain);
  }

  get signingKey() {
    return this.#signer.signingKey;
  }

  get privateKey() {
    return this.#signer.privateKey;
  }

  async getAddress() {
    return this.#signer.getAddress();
  }

  connect(provider) {
    this.#signer.connect(provider);
  }

  async signTransaction(tx) {
    return this.#signer.signTransaction(tx);
  }

  async signMessage(message) {
    return this.#signer.signTypedData(this.#domain, { PersonalSign }, ERC4337Utils.preparePersonalSign(message));
  }

  async signTypedData(domain, types, value) {
    const { allTypes, contentsTypeName, contentsDescr } = ERC4337Utils.getContentsDetail(types);

    return Promise.resolve(
      this.#signer.signTypedData(domain, allTypes, ERC4337Utils.prepareSignTypedData(value, this.#domain)),
    ).then(signature =>
      ethers.concat([
        signature,
        ethers.TypedDataEncoder.hashDomain(domain), // appDomainSeparator
        ethers.TypedDataEncoder.hashStruct(contentsTypeName, types, value), // contentsHash
        ethers.toUtf8Bytes(contentsDescr),
        ethers.toBeHex(contentsDescr.length, 2),
      ]),
    );
  }
}

class ERC4337Utils {
  static preparePersonalSign(message) {
    return {
      prefixed: ethers.concat([
        ethers.toUtf8Bytes(ethers.MessagePrefix),
        ethers.toUtf8Bytes(String(message.length)),
        typeof message === 'string' ? ethers.toUtf8Bytes(message) : message,
      ]),
    };
  }

  static prepareSignTypedData(contents, signerDomain) {
    return {
      name: signerDomain.name ?? '',
      version: signerDomain.version ?? '',
      chainId: signerDomain.chainId ?? 0,
      verifyingContract: signerDomain.verifyingContract ?? ethers.ZeroAddress,
      salt: signerDomain.salt ?? ethers.ZeroHash,
      contents,
    };
  }

  static getContentsDetail(contentsTypes, contentsTypeName = Object.keys(contentsTypes).at(0)) {
    // Examples values
    //
    // contentsTypeName         B
    // typedDataSignType        TypedDataSign(B contents,...)A(uint256 v)B(Z z)Z(A a)
    // contentsType             A(uint256 v)B(Z z)Z(A a)
    // contentsDescr            A(uint256 v)B(Z z)Z(A a)B
    const allTypes = { TypedDataSign: TypedDataSign(contentsTypeName), ...contentsTypes };
    const typedDataSignType = ethers.TypedDataEncoder.from(allTypes).encodeType('TypedDataSign');
    const contentsType = typedDataSignType.slice(typedDataSignType.indexOf(')') + 1); // Remove TypedDataSign (first object)
    const contentsDescr = contentsType + (contentsType.startsWith(contentsTypeName) ? '' : contentsTypeName);

    return {
      allTypes,
      contentsTypes,
      contentsTypeName,
      contentsDescr,
    };
  }
}

module.exports = {
  ERC7739Signer,
  ERC4337Utils,
  PersonalSign,
  TypedDataSign,
};
