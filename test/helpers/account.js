import { ethers } from 'ethers';

// Hardhat default balance
const DEFAULT_BALANCE = 10000n * ethers.WeiPerEther;

export const impersonate =
  ({ ethers, networkHelpers }) =>
  (account, balance = DEFAULT_BALANCE) => {
    const address = account.target ?? account.address ?? account;
    return networkHelpers
      .impersonateAccount(address)
      .then(() => networkHelpers.setBalance(address, balance))
      .then(() => ethers.getSigner(address));
  };
