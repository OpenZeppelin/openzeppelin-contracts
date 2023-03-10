#!/usr/bin/env node

// USAGE:
//    node certora/run.js [[CONTRACT_NAME:]SPEC_NAME] [OPTIONS...]
// EXAMPLES:
//    node certora/run.js AccessControl
//    node certora/run.js AccessControlHarness:AccessControl

const MAX_PARALLEL = 4;

let specs = require(__dirname + '/specs.json');

const proc = require('child_process');
const { PassThrough } = require('stream');
const events = require('events');
const limit = require('p-limit')(MAX_PARALLEL);

let [, , request = '', ...extraOptions] = process.argv;
if (request.startsWith('-')) {
  extraOptions.unshift(request);
  request = '';
}

if (request) {
  const [reqSpec, reqContract] = request.split(':').reverse();
  specs = Object.values(specs).filter(s => reqSpec === s.spec && (!reqContract || reqContract === s.contract));
  if (specs.length === 0) {
    console.error(`Error: Requested spec '${request}' not found in specs.json`);
    process.exit(1);
  }
}

for (const { spec, contract, files, options = [] } of Object.values(specs)) {
  limit(runCertora, spec, contract, files, [...options.flatMap(opt => opt.split(' ')), ...extraOptions]);
}

// Run certora, aggregate the output and print it at the end
async function runCertora(spec, contract, files, options = []) {
  const args = [...files, '--verify', `${contract}:certora/specs/${spec}.spec`, ...options];
  const child = proc.spawn('certoraRun', args);

  const stream = new PassThrough();
  const output = collect(stream);

  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });

  // as soon as we have a jobStatus link, print it
  stream.on('data', function logStatusUrl(data) {
    const urls = data.toString('utf8').match(/https?:\S*/g);
    for (const url of urls ?? []) {
      if (url.includes('/jobStatus/')) {
        console.error(`[${spec}] ${url.replace('/jobStatus/', '/output/')}`);
        stream.off('data', logStatusUrl);
        break;
      }
    }
  });

  // wait for process end
  const [code, signal] = await events.once(child, 'exit');

  // error
  if (code || signal) {
    console.error(`[${spec}] Exited with code ${code || signal}`);
    process.exitCode = 1;
  }

  // get all output
  stream.end();

  // write results in markdown format
  writeEntry(spec, contract, code || signal, (await output).match(/https:\S*/)?.[0]);

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
      url ? `[link](${url})` : 'error',
      url ? `[link](${url?.replace('/jobStatus/', '/output/')})` : 'error',
    ),
  );
}
