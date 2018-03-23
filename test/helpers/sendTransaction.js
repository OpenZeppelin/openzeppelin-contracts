const _ = require('lodash');
const ethjsABI = require('ethjs-abi');

export function findMethod (abi, name, args) {
  for (var i = 0; i < abi.length; i++) {
    const methodArgs = _.map(abi[i].inputs, 'type').join(',');
    if ((abi[i].name === name) && (methodArgs === args)) {
      return abi[i];
    }
  }
}

export default function sendTransaction (target, name, argsTypes, argsValues, opts) {
  const abiMethod = findMethod(target.abi, name, argsTypes);
  const encodedData = ethjsABI.encodeMethod(abiMethod, argsValues);
  return target.sendTransaction(Object.assign({ data: encodedData }, opts));
}
