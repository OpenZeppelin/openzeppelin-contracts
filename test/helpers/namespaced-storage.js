const { keccak256, id, toBeHex, MaxUint256 } = require('ethers');
const { artifacts } = require('hardhat');

function namespaceId(contractName) {
  return `openzeppelin.storage.${contractName}`;
}

function namespaceLocation(value) {
  const hashIdBN = BigInt(id(value)) - 1n; // keccak256(id) - 1
  const mask = MaxUint256 - 0xffn; // ~0xff
  return BigInt(keccak256(toBeHex(hashIdBN, 32))) & mask;
}

function namespaceSlot(contractName, offset) {
  try {
    // Try to get the artifact paths, will throw if it doesn't exist
    artifacts._getArtifactPathSync(`${contractName}Upgradeable`);
    return offset + namespaceLocation(namespaceId(contractName));
  } catch (_) {
    return offset;
  }
}

module.exports = {
  namespaceSlot,
  namespaceLocation,
  namespaceId,
};
