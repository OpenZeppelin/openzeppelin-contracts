import js from '@eslint/js';
import globals from "globals";
import prettier from 'eslint-config-prettier';
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default [
  includeIgnoreFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".gitignore")),
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
