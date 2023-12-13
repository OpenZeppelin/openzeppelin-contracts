const { ethers } = require('hardhat');

module.exports = {
  // TODO: remove conversion toNumber() when bigint are supported
  getChainId: () => ethers.provider.getNetwork().then(network => ethers.toNumber(network.chainId)),
};
