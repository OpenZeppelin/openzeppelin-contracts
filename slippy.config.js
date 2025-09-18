const namingConventionCommon = [
  {
    selector: 'variableLike',
    format: ['camelCase'],
    leadingUnderscore: 'allowSingleOrDouble',
    trailingUnderscore: 'allow',
  },
  {
    selector: 'typeLike',
    format: ['PascalCase'],
  },
  {
    selector: 'stateVariable',
    format: ['UPPER_CASE'],
    modifiers: ['constant'],
    leadingUnderscore: 'allow',
  },
  // interface should start with I
  {
    selector: 'interface',
    format: ['PascalCase'],
    custom: {
      match: true,
      regex: '^I[A-Z]',
    },
  },
];

const namingConventionSources = [
  ...namingConventionCommon,
  // constant and private state variables should not have a leading underscore
  {
    selector: 'stateVariable',
    format: ['camelCase', 'UPPER_CASE'],
    modifiers: ['private', 'constant'],
    leadingUnderscore: 'forbid',
  },
  // non-constant private state variables should have a leading underscore
  {
    selector: 'stateVariable',
    format: ['camelCase', 'UPPER_CASE'],
    modifiers: ['private'],
    leadingUnderscore: 'require',
  },
  // private functions and non-library internal functions should have a leading underscore
  {
    selector: 'function',
    modifiers: ['private'],
    format: ['camelCase'],
    leadingUnderscore: 'require',
  },
  {
    selector: 'function',
    modifiers: ['internal'],
    format: ['camelCase'],
    leadingUnderscore: 'require',
  },
  // library internal functions should not have a leading underscore
  {
    selector: 'function',
    modifiers: ['internal', 'library'],
    format: ['camelCase'],
    leadingUnderscore: 'forbid',
  },
];

const namingConventionTests = [
  ...namingConventionCommon,
  // allow snake_case in tests
  {
    selector: 'function',
    format: ['camelCase', 'snake_case'],
    leadingUnderscore: 'allow',
  },
];

module.exports = [
  {
    rules: {
      'compatible-pragma': 'error',
      curly: 'off',
      'explicit-types': 'error',
      'id-denylist': 'error',
      'imports-on-top': 'error',
      'max-state-vars': 'error',
      'named-return-params': 'error',
      'naming-convention': ['error', namingConventionCommon],
      'no-console': 'error',
      'no-default-visibility': 'off',
      'no-duplicate-imports': 'error',
      'no-empty-blocks': 'off',
      'no-global-imports': 'error',
      'no-restricted-syntax': 'off',
      'no-send': 'error',
      'no-tx-origin': 'error',
      'no-unchecked-calls': 'error',
      'no-uninitialized-immutable-references': 'error',
      'no-unused-vars': 'error',
      'one-contract-per-file': 'off',
      'private-vars': 'off',
      'require-revert-reason': 'off',
      'sort-imports': 'off',
      'sort-members': 'off',
      'sort-modifiers': 'error',
    },
  },
  {
    ignores: ['contracts/mocks/**/*', 'test/**/*'],
    rules: {
      'naming-convention': ['error', namingConventionSources],
      'no-default-visibility': 'error',
      'private-vars': 'error',
      'require-revert-reason': 'error',
    },
  },
  {
    files: ['test/**/*'],
    rules: {
      'naming-convention': ['error', namingConventionTests],
    },
  },
];
