import { isNodeType, findAll } from 'solidity-ast/utils.js';
import { slug } from './helpers';

export const anchor = function anchor({ item, contract }) {
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

export const fullname = function fullname({ item }) {
  let res = '';
  res += item.name;
  if ('parameters' in item) {
    const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
    res += slug('(' + signature + ')');
  }
  if (isNodeType('VariableDeclaration', item)) {
    res += '-' + slug(item.typeName.typeDescriptions.typeString);
  }
  if (res.charAt(res.length - 1) === '-') {
    return res.slice(0, -1);
  }
  return res;
};

export const inheritance = function ({ item, build }) {
  if (!isNodeType('ContractDefinition', item)) {
    throw new Error('inheritance modifier used on non-contract');
  }

  return item.linearizedBaseContracts
    .map(id => build.deref('ContractDefinition', id))
    .filter((c, i) => c.name !== 'Context' || i === 0);
};

export const hasFunctions = function ({ item }) {
  return item.inheritance.some(c => c.functions.length > 0);
};

export const hasEvents = function ({ item }) {
  return item.inheritance.some(c => c.events.length > 0);
};

export const hasErrors = function ({ item }) {
  return item.inheritance.some(c => c.errors.length > 0);
};

export const internalVariables = function ({ item }) {
  return item.variables.filter(({ visibility }) => visibility === 'internal');
};

export const hasInternalVariables = function ({ item }) {
  return internalVariables({ item }).length > 0;
};

export const functions = function ({ item }) {
  return [
    ...[...findAll('FunctionDefinition', item)].filter(f => f.visibility !== 'private'),
    ...[...findAll('VariableDeclaration', item)].filter(f => f.visibility === 'public'),
  ];
};

export const returns2 = function ({ item }) {
  if (isNodeType('VariableDeclaration', item)) {
    return [{ type: item.typeName.typeDescriptions.typeString }];
  } else {
    return item.returns;
  }
};

export const inheritedFunctions = function ({ item }) {
  const { inheritance } = item;
  const baseFunctions = new Set(inheritance.flatMap(c => c.functions.flatMap(f => f.baseFunctions ?? [])));
  return inheritance.map((contract, i) => ({
    contract,
    functions: contract.functions.filter(f => !baseFunctions.has(f.id) && (f.name !== 'constructor' || i === 0)),
  }));
};
