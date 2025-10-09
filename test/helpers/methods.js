const { ethers } = require('hardhat');

const selector = signature => ethers.FunctionFragment.from(signature).selector;

const interfaceId = signatures =>
  ethers.toBeHex(
    signatures.reduce((acc, signature) => acc ^ ethers.toBigInt(selector(signature)), 0n),
    4,
  );

module.exports = {
  selector,
  interfaceId,
};
