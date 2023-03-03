#!/usr/bin/env node

// USAGE:
//    node certora/run.js [[CONTRACT_NAME:]SPEC_NAME]
// EXAMPLES:
//    node certora/run.js AccessControl
//    node certora/run.js AccessControlHarness:AccessControl

const MAX_PARALLEL = 4;

const specs = require(__dirname + '/specs.json');

const proc = require('child_process');
const { PassThrough } = require('stream');
const events = require('events');
const limit = require('p-limit')(MAX_PARALLEL);

const [,, request = '', ...extraArgs] = process.argv;
const [reqContract, reqSpec] = request.split(':').reverse();

for (const { spec, contract, files, args = [] } of Object.values(specs)) {
  if ((!reqSpec || reqSpec === spec) && (!reqContract || reqContract === contract)) {
    limit(run, spec, contract, files, [...args, ...extraArgs]);
  }
}

// Run certora, aggregate the output and print it at the end
async function run(spec, contract, files, args = []) {
  args = [...files, '--verify', `${contract}:certora/specs/${spec}.spec`, ...args];
  const child = proc.spawn('echo', args);
  const stream = new PassThrough();
  const output = collect(stream);
  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });
  const [code, signal] = await events.once(child, 'exit');
  if (code || signal) {
    console.error(`Specification ${spec} exited with code ${code || signal}`);
    process.exitCode = 1;
  }
  stream.end();
  const cmd = ['certoraRun', ...args].join(' ');
  console.log(`+ ${cmd}\n` + (await output));
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
