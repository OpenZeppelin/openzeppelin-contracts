require('chai/register-should');
const { GSNDevProvider } = require('@openzeppelin/gsn-provider');
const { getGSNAccountAddresses } = require('./scripts/shared');

const solcStable = {
  version: '0.5.11',
};

const solcNightly = {
  version: 'nightly',
  docker: true,
};

const useSolcNightly = process.env.SOLC_NIGHTLY === 'true';
const addresses = getGSNAccountAddresses();

module.exports = {
  networks: {
    development: {
      provider: new GSNDevProvider('http://localhost:8545', {
        txfee: 70,
        useGSN: false,
        // The last two accounts defined in accounts.sh
        ownerAddress: addresses.GSN_account1,
        relayerAddress: addresses.GSN_account2,
      }),
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  plugins: ['solidity-coverage'],

  compilers: {
    solc: useSolcNightly ? solcNightly : solcStable,
  },
};
