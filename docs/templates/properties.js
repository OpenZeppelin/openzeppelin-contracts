const { docItemTypes } = require('solidity-docgen');
const { isNodeType, findAll } = require('solidity-ast/utils');
const { slug } = require('./helpers');

module.exports.anchor = function anchor({ item, contract }) {
  let res = '';
  if (contract) {
    res += contract.name + '-';
  }
  res += item.name;
  if (isNodeType('FunctionDefinition', item)) {
    const signature = item.parameters.parameters.map(v => v.typeName.typeDescriptions.typeString).join(',');
    res += slug('(' + signature + ')');
  }
  if (isNodeType('VariableDeclaration', item)) {
    res += '-' + slug(item.typeName.typeDescriptions.typeString);
  }
  return res;
}

module.exports.linkable = function linkable({ item }) {
  if (isNodeType('ContractDefinition', item)) {
    return item.nodes.filter(isNodeType(docItemTypes));
  }
}
