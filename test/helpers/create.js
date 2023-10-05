const { ethers } = require('hardhat');

module.exports = {
  computeCreateAddress: (from, nonce) => ethers.getCreateAddress({ from, nonce }),
  computeCreate2Address: (salt, bytecode, from) => ethers.getCreate2Address(from, salt, ethers.keccak256(bytecode)),
};
