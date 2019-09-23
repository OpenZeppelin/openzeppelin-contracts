const ganache = require('ganache-cli');
const shared = require('./scripts/shared');

module.exports = {
  skipFiles: [
    'lifecycle/Migrations.sol',
    'mocks'
  ],
  port: 8545,
  client: ganache,
  onServerReady: shared.setupGSNRelayHub,
  providerOptions: { accounts: shared.getAccounts() }
}
