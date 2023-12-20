const { artifacts } = require('hardhat');
const { erc7201slot, erc7201format } = require('./storage');

function namespaceSlot(contractName, offset) {
  try {
    // Try to get the artifact paths, will throw if it doesn't exist
    artifacts._getArtifactPathSync(`${contractName}Upgradeable`);
    return offset + erc7201slot(erc7201format(contractName));
  } catch (_) {
    return offset;
  }
}

module.exports = {
  namespaceSlot,
};
