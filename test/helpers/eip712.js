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

module.exports = {
  getDomain,
  domainType,
  domainSeparator: ethers.TypedDataEncoder.hashDomain,
  hashTypedData,
  ...types,
};
