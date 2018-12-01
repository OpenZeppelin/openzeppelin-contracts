const ethjsABI = require('ethjs-abi');
const { ethSendTransaction } = require('./web3');

function findMethod (abi, name, args) {
  for (let i = 0; i < abi.length; i++) {
    const methodArgs = abi[i].inputs.map(input => input.type).join(',');
    if ((abi[i].name === name) && (methodArgs === args)) {
      return abi[i];
    }
  }
}

async function transaction (target, name, argsTypes, argsValues, opts) {
  const abiMethod = findMethod(target.abi, name, argsTypes);
  const encodedData = ethjsABI.encodeMethod(abiMethod, argsValues);
  return target.sendTransaction(Object.assign({ data: encodedData }, opts));
}

function ether (from, to, value) {
  return ethSendTransaction({ from, to, value, gasPrice: 0 });
}

module.exports = {
  ether,
  transaction,
};
