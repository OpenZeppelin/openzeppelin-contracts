const { ethers } = require('hardhat');

module.exports = {
  selector: signature => ethers.FunctionFragment.from(signature).selector,
};
