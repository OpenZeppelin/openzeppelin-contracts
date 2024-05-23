import js from '@eslint/js';
import globals from "globals";
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.node,
        artifacts: 'readonly',
        contract: 'readonly',
        web3: 'readonly',
        extendEnvironment: 'readonly',
        expect: 'readonly',
      },
    },
  },
];
