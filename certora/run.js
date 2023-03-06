#!/usr/bin/env node

// USAGE:
//    node certora/run.js [[CONTRACT_NAME:]SPEC_NAME] [OPTIONS...]
// EXAMPLES:
//    node certora/run.js AccessControl
//    node certora/run.js AccessControlHarness:AccessControl

const MAX_PARALLEL = 4;

const specs = require(__dirname + '/specs.json');

const proc = require('child_process');
const { PassThrough } = require('stream');
const events = require('events');
const limit = require('p-limit')(MAX_PARALLEL);

let [, , request = '', ...extraOptions] = process.argv;
if (request.startsWith('-')) {
  extraOptions.unshift(request);
  request = '';
}
const [reqSpec, reqContract] = request.split(':').reverse();

for (const { spec, contract, files, options = [] } of Object.values(specs)) {
  if ((!reqSpec || reqSpec === spec) && (!reqContract || reqContract === contract)) {
    limit(runCertora, spec, contract, files, [...options, ...extraOptions]);
  }
}

// Run certora, aggregate the output and print it at the end
async function runCertora(spec, contract, files, options = []) {
  const args = [...files, '--verify', `${contract}:certora/specs/${spec}.spec`, ...options];
  const child = proc.spawn('certoraRun', args);

  const stream = new PassThrough();
  const output = collect(stream);

  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });

  stream.on('data', function logStatusUrl(data) {
    const url = data.toString('utf8').match(/https:\S*/);
    if (url?.[0].includes('/jobStatus/')) {
      console.log(`- **${spec}** (${contract}): [status](${url[0]}), [sumarry](${url[0].replace('/jobStatus/', '/output/')})`);
      stream.off('data', logStatusUrl);
    }
  });

  const [code, signal] = await events.once(child, 'exit');

  if (code || signal) {
    console.error(`[${spec}] Exited with code ${code || signal}`);
    process.exitCode = 1;
  }

  stream.end();

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
