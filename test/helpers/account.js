const { web3 } = require('hardhat');
const { impersonateAccount, setBalance } = require('@nomicfoundation/hardhat-network-helpers');

// Hardhat default balance
const DEFAULT_BALANCE = web3.utils.toBN('10000000000000000000000');

async function impersonate(account, balance = DEFAULT_BALANCE) {
  await impersonateAccount(account);
  await setBalance(account, balance);
}

module.exports = {
  impersonate,
};
