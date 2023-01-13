const hre = require('hardhat');

async function getChainId() {
  const chainIdHex = await hre.network.provider.send('eth_chainId', []);
  return new hre.web3.utils.BN(chainIdHex, 'hex');
}

module.exports = {
  getChainId,
};
