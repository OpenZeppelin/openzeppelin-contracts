import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
];
