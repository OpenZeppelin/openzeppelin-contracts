const { artifacts } = require('hardhat');

function namespaceId(contractName) {
  return `openzeppelin.storage.${contractName}`;
}

function namespaceLocation(id) {
  const hashIdBN = web3.utils.toBN(web3.utils.keccak256(id)).subn(1); // keccak256(id) - 1
  const hashIdHex = web3.utils.padLeft(web3.utils.numberToHex(hashIdBN), 64);

  const mask = BigInt(web3.utils.padLeft('0x00', 64, 'f')); // ~0xff

  return BigInt(web3.utils.keccak256(hashIdHex)) & mask;
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
