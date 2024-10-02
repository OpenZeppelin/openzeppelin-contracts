const { ethers } = require('hardhat');
const types = require('./eip712-types');

async function getDomain(contract) {
  const { fields, name, version, chainId, verifyingContract, salt, extensions } = await contract.eip712Domain();

  if (extensions.length > 0) {
    throw Error('Extensions not implemented');
  }

  const domain = {
    name,
    version,
    chainId,
    verifyingContract,
    salt,
  };

  for (const [i, { name }] of types.EIP712Domain.entries()) {
    if (!(fields & (1 << i))) {
      delete domain[name];
    }
  }

  return domain;
}

function domainType(domain) {
  return types.EIP712Domain.filter(({ name }) => domain[name] !== undefined);
}

function hashTypedData(domain, structHash) {
  return ethers.solidityPackedKeccak256(
    ['bytes', 'bytes32', 'bytes32'],
    ['0x1901', ethers.TypedDataEncoder.hashDomain(domain), structHash],
  );
}

function hashTypedDataEnvelopeType(contentsTypeName, contentsType) {
  return ethers.solidityPackedKeccak256(
    ['string'],
    [
      `TypedDataSign(${contentsTypeName}bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions)${contentsType}`,
    ],
  );
}

function hashTypedDataEnvelopeStruct(
  domain,
  contents,
  contentsTypeName,
  contentsType,
  salt = ethers.ZeroHash,
  extensions = [],
) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'address', 'bytes32', 'bytes32'],
      [
        hashTypedDataEnvelopeType(contentsTypeName, contentsType),
        contents,
        ethers.solidityPackedKeccak256(['string'], [domain.name]),
        ethers.solidityPackedKeccak256(['string'], [domain.version]),
        domain.chainId,
        domain.verifyingContract,
        salt,
        ethers.solidityPackedKeccak256(['uint256[]'], [extensions]),
      ],
    ),
  );
}

module.exports = {
  getDomain,
  domainType,
  domainSeparator: ethers.TypedDataEncoder.hashDomain,
  hashTypedData,
  hashTypedDataEnvelopeType,
  hashTypedDataEnvelopeStruct,
  ...types,
};
