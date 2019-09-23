/**
 * These are helpers to load account data & other things
 * which are shared by the shell scripts and javascript configs
 */
const { EOL } = require('os');
const { exec } = require('child_process');
const { readFileSync } = require('fs');

const log = console.log;

/**
 * Returns contents of file at '_path' as an array of its lines
 * @param  {String}   _path
 * @return {String[]}       lines
 */
function readLines (_path) {
  return readFileSync(_path, 'utf-8').split(EOL);
}

/**
 * Loads and parses the privateKey,balance accounts listed in scripts/accounts.sh.
 * @return {Object[]} Accounts in format required by ganache-core options
 */
function getAccounts () {
  const accounts = [];
  const regex = /--account="(.*),(.*)"/;
  const lines = readLines('scripts/accounts.sh');

  lines.forEach(line => {
    const parts = regex.exec(line);
    if (parts) {
      accounts.push({
        secretKey: parts[1],
        balance: `0x${parseInt(parts[2]).toString(16).toUpperCase()}`,
      });
    }
  });

  return accounts;
}

/**
 * Loads and parses GSN account addresses listed in scripts/account.sh
 * @return {Object}     { GSN_account0, GSN_account1, GSN_account2 }
 */
function getGSNAccountAddresses () {
  const accounts = {};
  const gsnRegex = /GSN_account.*/;
  const accountRegex = /(.*)="(.*)"/;
  const lines = readLines('scripts/accounts.sh');

  lines.forEach(line => {
    if (gsnRegex.test(line)) {
      const parts = accountRegex.exec(line);
      accounts[parts[1]] = parts[2];
    }
  });

  return accounts;
}

/**
 * Runs oz-gsn deploy-relay hub using GSN_account0 and
 * configurable port. Port defaults to 8545.
 * @param  {Object} config
 * @return {Promise}
 */
function setupGSNRelayHub (config = {}) {
  const port = config.port || 8545;
  const accounts = getGSNAccountAddresses();

  const command = 'npx oz-gsn deploy-relay-hub ' +
                  `--ethereumNodeURL "http://localhost:${port}" ` +
                  `--from "${accounts.GSN_account0}"`;

  return new Promise((resolve, reject) => {
    const gsnProcess = exec(command, {}, (err, stdout, stderr) => {
      if (err) {
        if (stdout) log(`oz-gsn stdout:\n${stdout}`);
        if (stderr) log(`oz-gsn stderr:\n${stderr}`);
        reject(err);
      }
    });

    gsnProcess.stdout.on('data', data => {
      log(`oz-gsn stdout: ${data}`);
      if (data.includes('RelayHub deployed at')) resolve();
    });

    gsnProcess.stderr.on('data', data => {
      log(`oz-gsn stderr: ${data}`);
      if (data.includes('RelayHub deployed at')) resolve();
    });
  });
}

module.exports = {
  getAccounts: getAccounts,
  getGSNAccountAddresses: getGSNAccountAddresses,
  setupGSNRelayHub: setupGSNRelayHub,
};
