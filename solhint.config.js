const customRules = require('./scripts/solhint-custom').map(r => r.ruleId);

const rules = [
  'no-unused-vars',
  'const-name-snakecase',
  'contract-name-camelcase',
  'event-name-camelcase',
  'func-name-mixedcase',
  'func-param-name-mixedcase',
  'modifier-name-mixedcase',
  'var-name-mixedcase',
  'imports-on-top',
  ...customRules.map(r => `openzeppelin/${r}`),
];

module.exports = {
  plugins: ['openzeppelin'],
  rules: Object.fromEntries(rules.map(r => [r, 'error'])),
};
