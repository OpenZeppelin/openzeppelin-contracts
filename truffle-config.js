require('chai/register-should');

const solcStable = {
  version: '0.5.7',
  settings: {
    evmVersion: 'constantinople',
  },
};

const solcNightly = {
  version: 'nightly',
  docker: true,
  settings: {
    evmVersion: 'constantinople',
  },
};

const useSolcNightly = process.env.SOLC_NIGHTLY === 'true';

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
  },

  compilers: {
    solc: useSolcNightly ? solcNightly : solcStable,
  },
};
