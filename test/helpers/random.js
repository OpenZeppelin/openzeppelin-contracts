const { ethers } = require('hardhat');

const generators = {
  address: () => ethers.Wallet.createRandom().address,
  bytes32: () => ethers.hexlify(ethers.randomBytes(32)),
  uint256: () => ethers.toBigInt(ethers.randomBytes(32)),
  int256: () => ethers.toBigInt(ethers.randomBytes(32)) + ethers.MinInt256,
  bytes: (length = 32) => ethers.hexlify(ethers.randomBytes(length)),
  string: () => ethers.uuidV4(ethers.randomBytes(32)),
};

generators.address.zero = ethers.ZeroAddress;
generators.bytes32.zero = ethers.ZeroHash;
generators.uint256.zero = 0n;
generators.int256.zero = 0n;
generators.bytes.zero = '0x';
generators.string.zero = '';

// alias hexBytes -> bytes
generators.hexBytes = generators.bytes;

module.exports = {
  generators,
};
