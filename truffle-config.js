module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },

    mainnet: {
      host: 'localhost',
      port: 8565,
      network_id: '1',
      gasPrice: 2000000000,
    },

    ropsten: {
      host: 'localhost',
      port: 8565,
      network_id: '3',
      gasPrice: 2000000000,
    },

    rinkeby: {
      host: 'localhost',
      port: 8565,
      network_id: '4',
      gasPrice: 0,
    },

    kovan: {
      host: 'localhost',
      port: 8565,
      network_id: '42',
      gasPrice: 0,
    },

  },

  compilers: {
    solc: {
      version: '0.5.2',
    },
  },
};
