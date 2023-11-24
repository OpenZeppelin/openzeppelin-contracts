const { ethers } = require('hardhat');
const { impersonateAccount, setBalance } = require('@nomicfoundation/hardhat-network-helpers');

// Hardhat default balance
const DEFAULT_BALANCE = 10000n * ethers.WeiPerEther;

const impersonate = (account, balance = DEFAULT_BALANCE) =>
  impersonateAccount(account)
    .then(() => setBalance(account, balance))
    .then(() => ethers.getSigner(account));

module.exports = {
  impersonate,
};
