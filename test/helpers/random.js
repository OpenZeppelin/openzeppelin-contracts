import { ethers } from 'ethers';

export const address = Object.assign(() => ethers.Wallet.createRandom().address, { zero: ethers.ZeroAddress });
export const bytes32 = Object.assign(() => ethers.hexlify(ethers.randomBytes(32)), { zero: ethers.ZeroHash });
export const bytes4 = Object.assign(() => ethers.hexlify(ethers.randomBytes(4)), {
  zero: ethers.zeroPadBytes('0x', 4),
});
export const uint256 = Object.assign(() => ethers.toBigInt(ethers.randomBytes(32)), { zero: 0n });
export const int256 = Object.assign(() => ethers.toBigInt(ethers.randomBytes(32)) + ethers.MinInt256, { zero: 0n });
export const bytes = Object.assign((length = 32) => ethers.randomBytes(length), { zero: [] });
export const hexBytes = Object.assign((length = 32) => ethers.hexlify(ethers.randomBytes(length)), { zero: '0x' });
export const string = Object.assign(() => ethers.uuidV4(ethers.randomBytes(32)), { zero: '' });
