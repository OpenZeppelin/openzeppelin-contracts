const { ethers } = require('ethers');

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
];

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

async function getDomain(contract) {
  const { fields, name, version, chainId, verifyingContract, salt, extensions } = await contract.eip712Domain();

  if (extensions.length > 0) {
    throw Error('Extensions not implemented');
  }

  const domain = {
    name,
    version,
    // TODO: remove check when contracts are all migrated to ethers
    chainId: web3.utils.isBN(chainId) ? chainId.toNumber() : chainId,
    verifyingContract,
    salt,
  };

  for (const [i, { name }] of EIP712Domain.entries()) {
    if (!(fields & (1 << i))) {
      delete domain[name];
    }
  }

  return domain;
}

function domainType(domain) {
  return EIP712Domain.filter(({ name }) => domain[name] !== undefined);
}

function hashTypedData(domain, structHash) {
  return ethers.keccak256(
    Buffer.concat(['0x1901', ethers.TypedDataEncoder.hashDomain(domain), structHash].map(ethers.toBeArray)),
  );
}

module.exports = {
  Permit,
  getDomain,
  domainType,
  domainSeparator: ethers.TypedDataEncoder.hashDomain,
  hashTypedData,
};
