const { ethers } = require('ethers');

const interface = ethers.Interface.from(['error Error(string)']);

module.exports = {
  encodeError: str => interface.encodeErrorResult('Error', [str]),
};
