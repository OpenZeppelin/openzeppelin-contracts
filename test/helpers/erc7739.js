const { ethers } = require('hardhat');
const { domainSeparator, formatType } = require('./eip712');

class PersonalSignHelper {
  static types = { PersonalSign: formatType({ prefixed: 'bytes' }) };

  static hash(message) {
    return ethers.hashMessage(message);
  }

  static sign(signer, message, signerDomain) {
    return signer.signTypedData(signerDomain, this.types, {
      prefixed: ethers.concat([
        ethers.toUtf8Bytes(ethers.MessagePrefix),
        ethers.toUtf8Bytes(String(message.length)),
        typeof message === 'string' ? ethers.toUtf8Bytes(message) : message,
      ]),
    });
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
    this.contentsName = contentsTypeName;
    this.contentsType = ethers.TypedDataEncoder.from(this.types).encodeType(contentsTypeName);
  }

  static prepareMessage(contents, signerDomain) {
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

  hash(message, appDomain) {
    return ethers.TypedDataEncoder.hash(appDomain, this.types, message);
  }

  sign(signer, message, appDomain) {
    return Promise.resolve(signer.signTypedData(appDomain, this.types, message)).then(signature =>
      ethers.concat([
        signature,
        domainSeparator(appDomain),
        ethers.TypedDataEncoder.hashStruct(this.contentsName, this.types, message.contents),
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
