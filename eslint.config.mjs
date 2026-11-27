import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import mocha from 'eslint-plugin-mocha';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  prettier,
  {
    plugins: { mocha },
    rules: {
      'mocha/no-async-suite': 'error',
      'mocha/no-exclusive-tests': 'error',
      'mocha/no-pending-tests': 'error',
      'no-restricted-syntax': [
        'error',
        {
          // A chai matcher that returns a promise (`eventually`, `reverted*`, `emit`, balance changes) must be
          // awaited or returned, otherwise its failure surfaces as an unhandled rejection, possibly in another test.
          selector:
            'ExpressionStatement > CallExpression:has(CallExpression[callee.name="expect"]):has(MemberExpression[property.name=/^(eventually|rejected|rejectedWith|reverted|revertedWith|revertedWithCustomError|revertedWithPanic|revertedWithoutReason|emit|changeTokenBalance|changeTokenBalances|changeEtherBalance|changeEtherBalances)$/]):not(:has(FunctionExpression)):not(:has(ArrowFunctionExpression))',
          message: 'Async chai matcher must be awaited or returned.',
        },
      ],
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.node,
      },
    },
  },
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
];
