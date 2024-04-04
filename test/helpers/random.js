const { ethers } = require('hardhat');

const generators = {
  address: () => ethers.Wallet.createRandom().address,
  bytes32: () => ethers.hexlify(ethers.randomBytes(32)),
  uint256: () => ethers.toBigInt(ethers.randomBytes(32)),
  int256: () => ethers.toBigInt(ethers.randomBytes(32)) + ethers.MinInt256,
  hexBytes: length => ethers.hexlify(ethers.randomBytes(length)),
};

generators.address.zero = ethers.ZeroAddress;
generators.bytes32.zero = ethers.ZeroHash;
generators.uint256.zero = 0n;
generators.int256.zero = 0n;
generators.hexBytes.zero = '0x';

module.exports = {
  generators,
};
