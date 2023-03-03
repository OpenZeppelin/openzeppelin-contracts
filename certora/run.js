#!/usr/bin/env node

const MAX_PARALLEL = 4;

const specs = require(__dirname + '/specs.json');

const proc = require('child_process');
const { PassThrough } = require('stream');
const events = require('events');
const limit = require('p-limit')(MAX_PARALLEL);

for (const [spec, { files, contract }] of Object.entries(specs)) {
  limit(run, files, contract, spec);
}

// Run certora, aggregate the output and print it at the end
async function run(files, contract, spec, args = []) {
  const child = proc.spawn('certoraRun', [...files, '--verify', `${contract}:${spec}`, '--optimistic-loop', ...args]);
  const stream = new PassThrough();
  const output = collect(stream);
  child.stdout.pipe(stream, { end: false });
  child.stderr.pipe(stream, { end: false });
  const [code, signal] = await events.once(child, 'exit');
  if (code || signal) {
    console.error(`Specification ${spec} exited with error ${code || signal}`);
  }
  stream.end();
  console.log(await output);
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
