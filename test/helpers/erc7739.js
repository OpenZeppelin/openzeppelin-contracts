const { ethers } = require('hardhat');
const { domainSeparator, formatType } = require('./eip712');

class PersonalSignHelper {
  static types = { PersonalSign: formatType({ prefixed: 'bytes' }) };

  static prepare(message) {
    return {
      prefixed: ethers.concat([
        ethers.toUtf8Bytes(ethers.MessagePrefix),
        ethers.toUtf8Bytes(String(message.length)),
        typeof message === 'string' ? ethers.toUtf8Bytes(message) : message,
      ]),
    };
  }

  static hash(message) {
    return message.prefixed ? ethers.keccak256(message.prefixed) : ethers.hashMessage(message);
  }

  static sign(signer, data, signerDomain) {
    return signer.signTypedData(signerDomain, this.types, data.prefixed ? data : this.prepare(data));
  }
}

class TypedDataSignHelper {
  constructor(contentsTypeName, contentsTypeValues) {
    this.types = {
      TypedDataSign: formatType({
        contents: contentsTypeName,
        fields: 'bytes1',
        name: 'string',
        version: 'string',
        chainId: 'uint256',
        verifyingContract: 'address',
        salt: 'bytes32',
        extensions: 'uint256[]',
      }),
      [contentsTypeName]: formatType(contentsTypeValues),
    };
    this.contentsTypeName = contentsTypeName;
    this.contentsType = ethers.TypedDataEncoder.from(this.types).encodeType(contentsTypeName);
  }

  static from(contentsTypeName, contentsTypeValues) {
    return new TypedDataSignHelper(contentsTypeName, contentsTypeValues);
  }

  static prepare(contents, signerDomain) {
    return Object.assign(
      {
        contents,
        fields: '0x0f',
        salt: ethers.ZeroHash,
        extensions: [],
      },
      signerDomain,
    );
  }

  hash(data, appDomain) {
    try {
      return ethers.TypedDataEncoder.hash(appDomain, this.types, data);
    } catch {
      return ethers.TypedDataEncoder.hash(
        appDomain,
        { [this.contentsTypeName]: this.types[this.contentsTypeName] },
        data,
      );
    }
  }

  sign(signer, data, appDomain) {
    return Promise.resolve(signer.signTypedData(appDomain, this.types, data)).then(signature =>
      ethers.concat([
        signature,
        domainSeparator(appDomain),
        ethers.TypedDataEncoder.hashStruct(this.contentsTypeName, this.types, data.contents),
        ethers.toUtf8Bytes(this.contentsType),
        ethers.toBeHex(this.contentsType.length, 2),
      ]),
    );
  }
}

module.exports = {
  PersonalSignHelper,
  TypedDataSignHelper,
};
