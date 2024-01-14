/// ENVVAR
// - CI:                output gas report to file instead of stdout
// - COVERAGE:          enable coverage report
// - ENABLE_GAS_REPORT: enable gas report
// - COMPILE_MODE:      production modes enables optimizations (default: development)
// - COMPILE_VERSION:   compiler version (default: 0.8.20)
// - COINMARKETCAP:     coinmarkercat api key for USD value in gas report
// - SRC:               contracts folder to compile (default: contracts)

const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const argv = require('yargs/yargs')()
  .env('')
  .options({
    // Compilation settings
    compiler: {
      alias: 'compileVersion',
      type: 'string',
      default: '0.8.20',
    },
    src: {
      alias: 'source',
      type: 'string',
      default: undefined,
    },
    mode: {
      alias: 'compileMode',
      type: 'string',
      choices: ['production', 'development'],
      default: 'development',
    },
    ir: {
      alias: 'enableIR',
      type: 'boolean',
      default: false,
    },
    // Extra modules
    coverage: {
      type: 'boolean',
      default: false,
    },
    gas: {
      alias: 'enableGasReport',
      type: 'boolean',
      default: false,
    },
    foundry: {
      alias: 'hasFoundry',
      type: 'boolean',
      default: undefined, // default depends on other options
    },
    coinmarketcap: {
      alias: 'coinmarketcapApiKey',
      type: 'string',
    },
  })
  .check(argv => {
    if (argv.foundry && argv.src)
      return 'Custom source is incompatible with Foundry. Disable with `FOUNDRY=false` in the environment';
    if (argv.foundry && argv.coverage)
      return 'Coverage analysis is incompatible with Foundry. Disable with `FOUNDRY=false` in the environment';
    return true;
  })
  .argv;

// if no value was specified for "foundry", and if "src" and "coverage" don't conflict with it,
// then check if foundry is available, and enable it if that is the case.
if (argv.foundry == undefined && !argv.src && !argv.coverage) {
  argv.foundry = hasFoundry();
}

require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-ethers');
require('hardhat-exposed');
require('hardhat-gas-reporter');
require('hardhat-ignore-warnings');
require('solidity-coverage');
require('solidity-docgen');
argv.foundry && require('@nomicfoundation/hardhat-foundry');

for (const f of fs.readdirSync(path.join(__dirname, 'hardhat'))) {
  require(path.join(__dirname, 'hardhat', f));
}

const withOptimizations = argv.gas || argv.coverage || argv.compileMode === 'production';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: argv.compiler,
    settings: {
      optimizer: {
        enabled: withOptimizations,
        runs: 200,
      },
      viaIR: withOptimizations && argv.ir,
      outputSelection: { '*': { '*': ['storageLayout'] } },
    },
  },
  warnings: {
    'contracts-exposed/**/*': {
      'code-size': 'off',
      'initcode-size': 'off',
    },
    '*': {
      'code-size': withOptimizations,
      'unused-param': !argv.coverage, // coverage causes unused-param warnings
      default: 'error',
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: !withOptimizations,
      initialBaseFeePerGas: argv.coverage ? 0 : undefined,
    },
  },
  exposed: {
    imports: true,
    initializers: true,
    exclude: ['vendor/**/*'],
  },
  gasReporter: {
    enabled: argv.gas,
    showMethodSig: true,
    currency: 'USD',
    coinmarketcap: argv.coinmarketcap,
  },
  paths: {
    sources: argv.src,
  },
  docgen: require('./docs/config'),
};

function hasFoundry() {
  return proc.spawnSync('forge', ['-V'], { stdio: 'ignore' }).error === undefined;
}
