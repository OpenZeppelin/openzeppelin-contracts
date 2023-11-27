const { ethers } = require('hardhat');

const randomArray = (generator, arrayLength = 3) => Array(arrayLength).fill().map(generator);

const generators = {
  address: () => ethers.Wallet.createRandom().address,
  bytes32: () => ethers.hexlify(ethers.randomBytes(32)),
  uint256: () => ethers.toBigInt(ethers.randomBytes(32)),
  hexBytes: length => ethers.hexlify(ethers.randomBytes(length)),
};

module.exports = {
  randomArray,
  generators,
};
