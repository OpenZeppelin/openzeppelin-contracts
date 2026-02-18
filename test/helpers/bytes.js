const { ethers } = require('hardhat');

const toNibbles = bytes => {
  const data = ethers.getBytes(bytes);
  const result = new Uint8Array(data.length * 2);
  for (let i = 0; i < data.length; i++) {
    result[i * 2] = data[i] >> 4;
    result[i * 2 + 1] = data[i] & 0x0f;
  }
  return ethers.hexlify(result);
};

module.exports = { toNibbles };
