const fs = require('fs');
const path = require('path');

require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-solhint');
require('solidity-coverage');
require('hardhat-gas-reporter');

for (const f of fs.readdirSync(path.join(__dirname, 'hardhat'))) {
  require(path.join(__dirname, 'hardhat', f));
}

const enableGasReport = !!process.env.ENABLE_GAS_REPORT;
const enableProduction = process.env.COMPILE_MODE === 'production';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: enableGasReport || enableProduction,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
    },
  },
  gasReporter: {
    enable: enableGasReport,
    currency: 'USD',
    outputFile: process.env.CI ? 'gas-report.txt' : undefined,
  },
};
