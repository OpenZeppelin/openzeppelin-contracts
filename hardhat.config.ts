import { defineConfig } from 'hardhat/config';

// Plugins
import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatEthersChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers';
import hardhatIgnoreWarnings from 'hardhat-ignore-warnings';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatNetworkHelpers from '@nomicfoundation/hardhat-network-helpers';
import hardhatPredeploy from 'hardhat-predeploy';
import hardhatDocgen from './hardhat/hardhat-solidity-docgen/plugin.ts';
import hardhatExposed from './hardhat/hardhat-exposed/plugin.ts';
import hardhatTranspiler from './hardhat/hardhat-transpiler/plugin.ts';
import hardhatOzContractsHelpers from './hardhat/hardhat-oz-contracts-helpers/plugin.ts';
import './hardhat/async-test-sanity.js';

// Parameters
import yargs from 'yargs/yargs';
const argv = await yargs()
  .env('')
  .options({
    compiler: { type: 'string', default: '0.8.35' },
    src: { type: 'string', default: 'contracts' },
    runs: { type: 'number', default: 200 },
    ir: { type: 'boolean', default: false },
    evm: { type: 'string', default: 'osaka' },
  })
  .parse();

// Configuration
export default defineConfig({
  plugins: [
    // Imported plugins
    hardhatEthers,
    hardhatEthersChaiMatchers,
    hardhatIgnoreWarnings,
    hardhatMocha,
    hardhatNetworkHelpers,
    hardhatPredeploy,
    // Local plugins
    hardhatDocgen,
    hardhatExposed,
    hardhatTranspiler,
    hardhatOzContractsHelpers,
  ],
  paths: {
    sources: argv.src,
  },
  solidity: {
    version: argv.compiler,
    settings: {
      optimizer: {
        enabled: true,
        runs: argv.runs,
      },
      evmVersion: argv.evm,
      viaIR: argv.ir,
      outputSelection: { '*': { '*': ['storageLayout'] } },
    },
  },
  networks: {
    default: {
      type: 'edr-simulated',
      hardfork: argv.evm,
      // Exposed contracts often exceed the maximum contract size. For normal contract,
      // we rely on the `code-size` compiler warning, that will cause a compilation error.
      allowUnlimitedContractSize: true,
    },
  },
  test: {
    mocha: process.argv.includes('--coverage') ? { fgrep: '[skip-on-coverage]', invert: true } : undefined,
    solidity: {
      fuzz: {
        runs: 5000,
        maxTestRejects: 150000,
      },
      fsPermissions: {
        readDirectory: ['node_modules/hardhat-predeploy/bin'],
      },
    },
  },
  coverage: {
    skipFiles: ['contracts/mocks/**', 'contracts-exposed/**', 'lib/**'],
  },
  warnings: {
    'lib/**/*': 'off',
    'npm/**/*': 'off',
    'test/**/*': 'off',
    'contracts-exposed/**/*': {
      'code-size': 'off',
      'initcode-size': 'off',
    },
    '*': {
      'transient-storage': 'off',
      6335: 'warn', // is-future-solidity-keyword
      default: 'error',
    },
  },
  exposed: {
    initializers: true,
    include: ['contracts/**/*.sol'],
    exclude: ['**/*WithInit.sol'],
  },
  docgen: await import('./docs/config.mjs').then(m => m.default),
});
