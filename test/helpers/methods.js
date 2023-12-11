const { ethers } = require('hardhat');

const selector = signature => ethers.FunctionFragment.from(signature).selector;

const interfaceId = signatures =>
  ethers.toBeHex(
    ethers.Interface.from(signatures.map(fn => `function ${fn}`))
      .fragments.filter(f => f.type === 'function')
      .reduce((acc, { selector }) => acc ^ ethers.toBigInt(selector), 0n),
    4,
  );

module.exports = {
  selector,
  interfaceId,
};
