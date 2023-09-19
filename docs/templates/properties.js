const { isNodeType } = require('solidity-ast/utils');
const { slug } = require('./helpers');

module.exports.anchor = function anchor({ item, contract }) {
  let res = '';
  if (contract) {
    res += contract.name + '-';
  }
  res += item.name;
  if ('parameters' in item) {
    const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
    res += slug('(' + signature + ')');
  }
  if (isNodeType('VariableDeclaration', item)) {
    res += '-' + slug(item.typeName.typeDescriptions.typeString);
  }
  return res;
};

module.exports.inheritance = function ({ item, build }) {
  if (!isNodeType('ContractDefinition', item)) {
    throw new Error('used inherited-items on non-contract');
  }

  return item.linearizedBaseContracts
    .map(id => build.deref('ContractDefinition', id))
    .filter((c, i) => c.name !== 'Context' || i === 0);
};

module.exports['has-functions'] = function ({ item }) {
  return item.inheritance.some(c => c.functions.length > 0);
};

module.exports['has-events'] = function ({ item }) {
  return item.inheritance.some(c => c.events.length > 0);
};

module.exports['has-errors'] = function ({ item }) {
  return item.inheritance.some(c => c.errors.length > 0);
};

module.exports['inherited-functions'] = function ({ item }) {
  const { inheritance } = item;
  const baseFunctions = new Set(inheritance.flatMap(c => c.functions.flatMap(f => f.baseFunctions ?? [])));
  return inheritance.map((contract, i) => ({
    contract,
    functions: contract.functions.filter(f => !baseFunctions.has(f.id) && (f.name !== 'constructor' || i === 0)),
  }));
};
