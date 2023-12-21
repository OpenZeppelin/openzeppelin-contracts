const { ethers, artifacts } = require('hardhat');
const { erc7201slot } = require('./erc1967');

function namespaceId(contractName) {
  return `openzeppelin.storage.${contractName}`;
}

function namespaceSlot(contractName, offset) {
  try {
    // Try to get the artifact paths, will throw if it doesn't exist
    artifacts._getArtifactPathSync(`${contractName}Upgradeable`);
    return offset + ethers.toBigInt(erc7201slot(namespaceId(contractName)));
  } catch (_) {
    return offset;
  }
}

module.exports = {
  namespaceSlot,
  namespaceLocation: erc7201slot,
  namespaceId,
};
