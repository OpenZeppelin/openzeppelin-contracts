#!/usr/bin/env node

// USAGE:
//    node certora/run.js [[CONTRACT_NAME:]SPEC_NAME]* [--all] [--options OPTIONS...] [--specs PATH]
// EXAMPLES:
//    node certora/run.js --all
//    node certora/run.js AccessControl
//    node certora/run.js AccessControlHarness:AccessControl

import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import { once } from 'events';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pLimit from 'p-limit';
import fs from 'fs/promises';

const argv = yargs(hideBin(process.argv))
  .env('')
  .options({
    all: {
      alias: 'a',
      type: 'boolean',
    },
    spec: {
      alias: 's',
      type: 'string',
      default: path.resolve(import.meta.dirname, 'specs.json'),
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
    options: {
      alias: 'o',
      type: 'array',
      default: [],
    },
  })
  .parse();

function match(entry, request) {
  const [reqSpec, reqContract] = request.split(':').reverse();
  return entry.spec == reqSpec && (!reqContract || entry.contract == reqContract);
}

const specs = JSON.parse(fs.readFileSync(argv.spec, 'utf8')).filter(s => argv.all || argv._.some(r => match(s, r)));

const limit = pLimit(argv.parallel);

if (argv._.length == 0 && !argv.all) {
  console.error(`Warning: No specs requested. Did you forget to toggle '--all'?`);
}

for (const r of argv._) {
  if (!specs.some(s => match(s, r))) {
    console.error(`Error: Requested spec '${r}' not found in ${argv.spec}`);
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

for (const { spec, contract, files, options = [] } of specs) {
  limit(() =>
    runCertora(
      spec,
      contract,
      files,
      [...options, ...argv.options].flatMap(opt => opt.split(' ')),
    ),
  );
}

// Run certora, aggregate the output and print it at the end
async function runCertora(spec, contract, files, options = []) {
  const args = [...files, '--verify', `${contract}:certora/specs/${spec}.spec`, ...options];
  if (argv.verbose) {
    console.log('Running:', args.join(' '));
  }
  const child = spawn('certoraRun', args);

  const stream = new PassThrough();
  const output = collect(stream);

  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });

  // as soon as we have a job id, print the output link
  stream.on('data', function logStatusUrl(data) {
    const { '-DjobId': jobId, '-DuserId': userId } = Object.fromEntries(
      data
        .toString('utf8')
        .match(/-D\S+=\S+/g)
        ?.map(s => s.split('=')) || [],
    );

    if (jobId && userId) {
      console.error(`[${spec}] https://prover.certora.com/output/${userId}/${jobId}/`);
      stream.off('data', logStatusUrl);
    }
  });

  // wait for process end
  const [code, signal] = await once(child, 'exit');

  // error
  if (code || signal) {
    console.error(`[${spec}] Exited with code ${code || signal}`);
    process.exitCode = 1;
  }

  // get all output
  stream.end();

  // write results in markdown format
  writeEntry(spec, contract, code || signal, (await output).match(/https:\/\/prover.certora.com\/output\/\S*/)?.[0]);

  // write all details
  console.error(`+ certoraRun ${args.join(' ')}\n` + (await output));
}

// Collects stream data into a string
async function collect(stream) {
  const buffers = [];
  for await (const data of stream) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    buffers.push(buf);
  }
  return Buffer.concat(buffers).toString('utf8');
}

// Formatting
let hasHeader = false;

function formatRow(...array) {
  return ['', ...array, ''].join(' | ');
}

function writeHeader() {
  console.log(formatRow('spec', 'contract', 'result', 'status', 'output'));
  console.log(formatRow('-', '-', '-', '-', '-'));
}

function writeEntry(spec, contract, success, url) {
  if (!hasHeader) {
    hasHeader = true;
    writeHeader();
  }
  console.log(
    formatRow(
      spec,
      contract,
      success ? ':x:' : ':heavy_check_mark:',
      url ? `[link](${url?.replace('/output/', '/jobStatus/')})` : 'error',
      url ? `[link](${url})` : 'error',
    ),
  );
}
