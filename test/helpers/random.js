import { ethers } from 'ethers';

export const generators = {
  address: Object.assign(() => ethers.Wallet.createRandom().address, { zero: ethers.ZeroAddress }),
  bytes32: Object.assign(() => ethers.hexlify(ethers.randomBytes(32)), { zero: ethers.ZeroHash }),
  bytes4: Object.assign(() => ethers.hexlify(ethers.randomBytes(4)), { zero: ethers.zeroPadBytes('0x', 4) }),
  uint256: Object.assign(() => ethers.toBigInt(ethers.randomBytes(32)), { zero: 0n }),
  int256: Object.assign(() => ethers.toBigInt(ethers.randomBytes(32)) + ethers.MinInt256, { zero: 0n }),
  bytes: Object.assign((length = 32) => ethers.hexlify(ethers.randomBytes(length)), { zero: '0x' }),
  hexBytes: Object.assign((length = 32) => ethers.hexlify(ethers.randomBytes(length)), { zero: '0x' }),
  string: Object.assign(() => ethers.uuidV4(ethers.randomBytes(32)), { zero: '' }),
};
