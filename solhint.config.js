const customRules = require('./scripts/solhint-custom');

const rules = [
  'avoid-tx-origin',
  'const-name-snakecase',
  'contract-name-camelcase',
  'event-name-camelcase',
  'explicit-types',
  'func-name-mixedcase',
  'func-param-name-mixedcase',
  'imports-on-top',
  'modifier-name-mixedcase',
  'no-console',
  'no-global-import',
  'no-unused-vars',
  'quotes',
  'use-forbidden-name',
  'var-name-mixedcase',
  'visibility-modifier-order',
  ...customRules.map(r => `openzeppelin/${r.ruleId}`),
];

module.exports = {
  plugins: ['openzeppelin'],
  rules: Object.fromEntries(rules.map(r => [r, 'error'])),
};
