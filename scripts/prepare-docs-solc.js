const path = require('path');
const bre = require('@nomiclabs/buidler');

const { Compiler } = require('@nomiclabs/buidler/internal/solidity/compiler');

const compiler = new Compiler(
  bre.config.solc.version,
  path.join(bre.config.paths.cache, 'compilers'),
);

module.exports = Object.assign(compiler.getSolc(), { __esModule: true });
