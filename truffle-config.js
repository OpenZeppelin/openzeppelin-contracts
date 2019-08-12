require('chai/register-should');
const { GSNDevProvider } = require('@openzeppelin/gsn-provider');

const solcStable = {
  version: '0.5.7',
};

const solcNightly = {
  version: 'nightly',
  docker: true,
};

const useSolcNightly = process.env.SOLC_NIGHTLY === 'true';

module.exports = {
  networks: {
    development: {
      provider: new GSNDevProvider('http://localhost:8545', {
        txfee: 70,
        useGSN: false,
        // The last two accounts defined in test.sh
        ownerAddress: '0x26be9c03ca7f61ad3d716253ee1edcae22734698',
        relayerAddress: '0xdc5fd04802ea70f6e27aec12d56716624c98e749',
      }),
      network_id: '*', // eslint-disable-line camelcase
    },
    coverage: {
      provider: new GSNDevProvider('http://localhost:8555', {
        txfee: 70,
        useGSN: false,
        // The last two accounts defined in test.sh
        ownerAddress: '0x26be9c03ca7f61ad3d716253ee1edcae22734698',
        relayerAddress: '0xdc5fd04802ea70f6e27aec12d56716624c98e749',
      }),
      gas: 0xfffffffffff,
      gasPrice: 0x01,
      network_id: '*', // eslint-disable-line camelcase
    },

    mainnet: {
      host: 'localhost',
      port: 8565,
      network_id: '1', // eslint-disable-line camelcase
      gasPrice: 20000000000,
      from: '0x6Bf917B4725aD736B33Dbd493Ad7a4B992150DAb',
    },

    ropsten: {
      host: 'localhost',
      port: 8565,
      network_id: '3', // eslint-disable-line camelcase
      gasPrice: 2000000000,
    },

    rinkeby: {
      host: 'localhost',
      port: 8565,
      network_id: '4', // eslint-disable-line camelcase
      gasPrice: 0,
    },

    kovan: {
      host: 'localhost',
      port: 8565,
      network_id: '42', // eslint-disable-line camelcase
      gasPrice: 0,
    },

  },

  compilers: {
    solc: useSolcNightly ? solcNightly : solcStable,
  },
};
