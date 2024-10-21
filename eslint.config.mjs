import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'path';

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
  includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
];
