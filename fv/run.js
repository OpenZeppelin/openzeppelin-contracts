#!/usr/bin/env node

// USAGE:
//    node fv/run.js [CONFIG]* [--all]
// EXAMPLES:
//    node fv/run.js --all
//    node fv/run.js ERC721
//    node fv/run.js fv/specs/ERC721.conf

import { glob } from 'glob';
import fs from 'fs';
import pLimit from 'p-limit';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { execFile } from 'child_process';

const { argv } = yargs(hideBin(process.argv))
  .env('')
  .options({
    all: {
      type: 'boolean',
    },
    parallel: {
      alias: 'p',
      type: 'number',
      default: 4,
    },
    verbose: {
      alias: 'v',
      type: 'count',
      default: 0,
    },
  });

const pattern = 'fv/specs/*.conf';
const limit = pLimit(argv.parallel);

if (argv._.length == 0 && !argv.all) {
  console.error(`Warning: No specs requested. Did you forget to toggle '--all'?`);
  process.exitCode = 1;
} else {
  await Promise.all(
    (argv.all ? glob.sync(pattern) : argv._.map(name => (fs.existsSync(name) ? name : pattern.replace('*', name)))).map(
      (conf, i, { length }) =>
        limit(
          () =>
            new Promise(resolve => {
              if (argv.verbose) console.log(`[${i + 1}/${length}] Running ${conf}`);
              // execFile (and not exec) so that the config name is passed as an argument and never
              // interpreted by a shell: it may come from an untrusted pull request.
              execFile('certoraRun', [conf], (error, stdout, stderr) => {
                const match = stdout.match(
                  'https://prover.certora.com/output/[a-z0-9]+/[a-z0-9]+[?]anonymousKey=[a-z0-9]+',
                );
                if (error) {
                  console.error(`[ERR] ${conf} failed with:\n${stderr || stdout}`);
                  process.exitCode = 1;
                } else if (match) {
                  console.log(`${conf} - ${match[0]}`);
                } else {
                  console.error(`[ERR] Could not parse stdout for ${conf}:\n${stdout}`);
                  process.exitCode = 1;
                }
                resolve();
              });
            }),
        ),
    ),
  );
}
