#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const { argv } = require('yargs')
  .env()
  .options({
    style: {
      type: 'string',
      choices: [ 'bash', 'markdown' ],
      default: 'bash',
    },
  });

// Deduce bas tx cost from the percentage denominator
const BASE_TX_COST = 21000;

// Utilities
function zip (...args) {
  return Array(Math.max(...args.map(arg => arg.length))).fill(null).map((_, i) => args.map(arg => arg[i]));
}

function unique (array, op = x => x) {
  return array.filter((obj, i) => array.findIndex(entry => op(obj) === op(entry)) === i);
}

// Report class
class Report {
  // Read report file
  static load (filepath) {
    // see https://stackoverflow.com/a/29497680/1503898
    const data = fs.readFileSync(filepath)
      .toString()
      .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    return this.parse(data);
  }

  // Parse report file
  static parse (data) {
    const report = {};
    for (const parsed of data.matchAll(/([·|]\s+([a-zA-Z0-9.-]+)\s+){7}/g)) {
      const params = parsed[0].matchAll(/([a-zA-Z0-9.-]+)/g);
      const contract = params.next().value[0];
      const method = params.next().value[0];
      const min = Number(params.next().value[0]);
      const max = Number(params.next().value[0]);
      const avg = Number(params.next().value[0]);
      report[contract] = report[contract] || [];
      report[contract].push({ method, min, max, avg });
    }
    return report;
  }

  // Compare two reports
  static compare (update, ref, opts = { hideEqual: true }) {
    // For each contract in the new report
    // ... if the contract exist in the old report
    // ... ... for all (unique) function names in the contract
    // ... ... zip the corresponding function from the old and new report
    // ... ... skip the function doesn't exist in either contract
    // ... ... skip if the report are identical and if we have the hideEqual option
    // ... ... generate the log line
    // ... skip contracts for which there is no log
    const rows = Object.keys(update)
      .filter(contract => ref[contract])
      .map(contract => unique(update[contract]
        .map(({ method }) => method))
        .flatMap(method => zip(
          update[contract].filter(entry => entry.method === method),
          ref[contract].filter(entry => entry.method === method),
        ))
        .filter(([ current, previous ]) => current && previous)
        .filter(([ current, previous ]) => !opts.hideEqual || JSON.stringify(current) !== JSON.stringify(previous))
        .map(([ current, previous ]) => ({
          contract,
          method: current.method,
          min: {
            total: current.min,
            delta: current.min - previous.min,
            ratio: 100 * (current.min - previous.min) / (previous.min + BASE_TX_COST),
          },
          max: {
            total: current.max,
            delta: current.max - previous.max,
            ratio: 100 * (current.max - previous.max) / (previous.max + BASE_TX_COST),
          },
          avg: {
            total: current.avg,
            delta: current.avg - previous.avg,
            ratio: 100 * (current.avg - previous.avg) / (previous.avg + BASE_TX_COST),
          },
        })))
      .filter(Boolean);
    return rows;
  }
}

// Display
function center (text, length) {
  return text.padStart((text.length + length) / 2).padEnd(length);
}

function formatCmpBash (rows) {
  const contractLength = Math.max(...rows.map(x => Math.max(...x.map(({ contract }) => contract.length))));
  const methodLength = Math.max(...rows.map(x => Math.max(...x.map(({ method }) => method.length))));

  const COLS = [
    { txt: '', length: 0 },
    { txt: 'Contract', length: contractLength },
    { txt: 'Method', length: methodLength },
    { txt: 'Min', length: 30 },
    { txt: 'Max', length: 30 },
    { txt: 'Avg', length: 30 },
    { txt: '', length: 0 },
  ];
  const HEADER = COLS.map(entry => chalk.bold(center(entry.txt, entry.length || 0))).join(' | ').trim();
  const SEPARATOR = COLS.map(({ length }) => length > 0 ? '-'.repeat(length + 2) : '').join('|').trim();

  return [
    '',
    HEADER,
    ...rows.map(methods => methods.map(entry => [
      '',
      chalk.grey(entry.contract.padEnd(contractLength)),
      entry.method.padEnd(methodLength),
      /* eslint-disable max-len */
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.total) ? '-' : entry.min.total.toString()).padStart(8)),
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.delta) ? '-' : entry.min.total.toString()).padStart(8)),
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.ratio) ? '-' : entry.min.ratio.toFixed(2) + '%').padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.total) ? '-' : entry.max.total.toString()).padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.delta) ? '-' : entry.max.total.toString()).padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.ratio) ? '-' : entry.max.ratio.toFixed(2) + '%').padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.total) ? '-' : entry.avg.total.toString()).padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.delta) ? '-' : entry.avg.total.toString()).padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.ratio) ? '-' : entry.avg.ratio.toFixed(2) + '%').padStart(8)),
      /* eslint-enable max-len */
      '',
    ].join(' | ').trim()).join('\n')),
    '',
  ].join(`\n${SEPARATOR}\n`).trim();
}

function alignPattern (align) {
  switch (align) {
  case 'left':
  case undefined:
    return ':-';
  case 'right':
    return '-:';
  case 'center':
    return ':-:';
  }
}

function trend (value) {
  return value > 0
    ? ':x:'
    : value < 0
      ? ':heavy_check_mark:'
      : '';
}

function formatCmpMarkdown (rows) {
  const COLS = [
    { txt: '' },
    { txt: 'Contract', align: 'left' },
    { txt: 'Method', align: 'left' },
    { txt: 'Min', align: 'right' },
    { txt: '(+/-)', align: 'right' },
    { txt: '%', align: 'right' },
    { txt: 'Max', align: 'right' },
    { txt: '(+/-)', align: 'right' },
    { txt: '%', align: 'right' },
    { txt: 'Avg', align: 'right' },
    { txt: '(+/-)', align: 'right' },
    { txt: '%', align: 'right' },
    { txt: '' },
  ];
  const HEADER = COLS.map(entry => entry.txt).join(' | ').trim();
  const SEPARATOR = COLS.map(entry => entry.txt ? alignPattern(entry.align) : '').join('|').trim();

  return [
    '',
    HEADER,
    SEPARATOR,
    ...rows.map(methods => methods.map(entry => [
      '',
      entry.contract,
      entry.method,
      (isNaN(entry.min.total) ? '-' : entry.min.total.toString()).padStart(8),
      (isNaN(entry.min.delta) ? '-' : entry.min.delta.toString()).padStart(8),
      (isNaN(entry.min.ratio) ? '-' : entry.min.ratio.toFixed(2) + '%').padStart(8) + trend(entry.min.delta),
      (isNaN(entry.max.total) ? '-' : entry.max.total.toString()).padStart(8),
      (isNaN(entry.max.delta) ? '-' : entry.max.delta.toString()).padStart(8),
      (isNaN(entry.max.ratio) ? '-' : entry.max.ratio.toFixed(2) + '%').padStart(8) + trend(entry.max.delta),
      (isNaN(entry.avg.total) ? '-' : entry.avg.total.toString()).padStart(8),
      (isNaN(entry.avg.delta) ? '-' : entry.avg.delta.toString()).padStart(8),
      (isNaN(entry.avg.ratio) ? '-' : entry.avg.ratio.toFixed(2) + '%').padStart(8) + trend(entry.avg.delta),
      '',
    ].join(' | ').trim()).join('\n')),
    '',
  ].join('\n').trim();
}

// MAIN
const report = Report.compare(Report.load(argv._[0]), Report.load(argv._[1]));

switch (argv.style) {
case 'markdown':
  console.log(formatCmpMarkdown(report));
  break;
case 'bash':
default:
  console.log(formatCmpBash(report));
  break;
}
