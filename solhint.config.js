const customRules = require('solhint-plugin-openzeppelin');

const rules = [
  'avoid-tx-origin',
  'const-name-snakecase',
  'contract-name-capwords',
  'event-name-capwords',
  'max-states-count',
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
  'interface-starts-with-i',
  'duplicated-imports',
  ...customRules.map(r => `openzeppelin/${r.ruleId}`),
];

module.exports = {
  plugins: ['openzeppelin'],
  rules: Object.fromEntries(rules.map(r => [r, 'error'])),
};
