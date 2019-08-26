require('chai/register-should');
const { GSNDevProvider } = require('@openzeppelin/gsn-provider');

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
  },

  compilers: {
    solc: useSolcNightly ? solcNightly : solcStable,
  },
};
