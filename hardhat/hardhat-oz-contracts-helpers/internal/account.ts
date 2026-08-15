import { ethers } from 'ethers';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

// Hardhat default balance
const DEFAULT_BALANCE = 10000n * ethers.WeiPerEther;

export const impersonate =
  <ChainTypeT extends ChainType | string>({ ethers, networkHelpers }: NetworkConnection<ChainTypeT>) =>
  (account: any, balance = DEFAULT_BALANCE) => {
    const address = account.target ?? account.address ?? account;
    return networkHelpers
      .impersonateAccount(address)
      .then(() => networkHelpers.setBalance(address, balance))
      .then(() => ethers.getSigner(address));
  };
