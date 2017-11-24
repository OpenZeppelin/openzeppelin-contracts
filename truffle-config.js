require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint)

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC,
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
)

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3 // official id of the ropsten network
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    testrpc: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*'
    },
  }
};
