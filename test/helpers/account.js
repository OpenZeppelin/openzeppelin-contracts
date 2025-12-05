const { ethers } = require('hardhat');
const { impersonateAccount, setBalance } = require('@nomicfoundation/hardhat-network-helpers');

// Hardhat default balance
const DEFAULT_BALANCE = 10000n * ethers.WeiPerEther;

const impersonate = (account, balance = DEFAULT_BALANCE) => {
  const address = account.target ?? account.address ?? account;
  return impersonateAccount(address)
    .then(() => setBalance(address, balance))
    .then(() => ethers.getSigner(address));
};

module.exports = {
  impersonate,
};
