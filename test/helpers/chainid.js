const { ethers } = require('hardhat');

module.exports = {
  getChainId: () => ethers.provider.getNetwork().then(network => network.chainId),
};
