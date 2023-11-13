const { ethers } = require('hardhat');

function randomHex(length) {
  return `0x${Buffer.from(ethers.randomBytes(length)).toString('hex')}`;
}

module.exports = { randomHex };
