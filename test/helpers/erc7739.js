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
  constructor(contentsTypes, contentsTypeName = Object.keys(contentsTypes).at(0)) {
    this.allTypes = {
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
      ...contentsTypes,
    };
    this.types = contentsTypes;
    this.contentsTypeName = contentsTypeName;
    this.contentsType = ethers.TypedDataEncoder.from(this.types).encodeType(contentsTypeName);
  }

  static from(contentsTypes, contentsTypeName = Object.keys(contentsTypes).at(0)) {
    return new TypedDataSignHelper(contentsTypes, contentsTypeName);
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
      return ethers.TypedDataEncoder.hash(appDomain, this.allTypes, data);
    } catch {
      return ethers.TypedDataEncoder.hash(appDomain, this.types, data);
    }
  }

  sign(signer, data, appDomain) {
    return Promise.resolve(signer.signTypedData(appDomain, this.allTypes, data)).then(signature =>
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
