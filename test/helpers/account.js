const { ethers } = require('hardhat');
const { impersonateAccount, setBalance } = require('@nomicfoundation/hardhat-network-helpers');

// Hardhat default balance
const DEFAULT_BALANCE = 10000n * ethers.WeiPerEther;

async function impersonate(account, balance = DEFAULT_BALANCE) {
  await impersonateAccount(account);
  await setBalance(account, balance);
}

module.exports = {
  impersonate,
};
