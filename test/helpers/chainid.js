const hre = require('hardhat');

async function getChainId() {
  const chainIdHex = await hre.network.provider.send('eth_chainId', []);
  return new hre.web3.utils.BN(chainIdHex, 'hex');
}

module.exports = {
  getChainId,
  // TODO: when tests are ready to support bigint chainId
  // getChainId: ethers.provider.getNetwork().then(network => network.chainId),
};
