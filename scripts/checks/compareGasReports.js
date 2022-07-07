#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const { argv } = require('yargs')
  .env()
  .options({
    style: {
      type: 'string',
      choices: [ 'shell', 'markdown' ],
      default: 'shell',
    },
  });

// Deduce base tx cost from the percentage denominator
const BASE_TX_COST = 21000;

// Utilities
function sum (...args) {
  return args.reduce((a, b) => a + b, 0);
}

function average (...args) {
  return sum(...args) / args.length;
}

function variation (current, previous) {
  return {
    value: current,
    delta: current - previous,
    prcnt: 100 * (current - previous) / (previous - BASE_TX_COST),
  };
}

// Report class
class Report {
  // Read report file
  static load (filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  // Compare two reports
  static compare (update, ref, opts = { hideEqual: true }) {
    if (JSON.stringify(update.config.metadata) !== JSON.stringify(ref.config.metadata)) {
      throw new Error('Reports produced with non matching metadata');
    }
    return Object.keys(update.info.methods)
      .filter(key => ref.info.methods[key])
      .filter(key => update.info.methods[key].numberOfCalls > 0)
      .filter(key => update.info.methods[key].numberOfCalls === ref.info.methods[key].numberOfCalls)
      .map(key => ({
        contract: ref.info.methods[key].contract,
        method: ref.info.methods[key].fnSig,
        min: variation(...[update, ref].map(x => ~~Math.min(...x.info.methods[key].gasData))),
        max: variation(...[update, ref].map(x => ~~Math.max(...x.info.methods[key].gasData))),
        avg: variation(...[update, ref].map(x => ~~average(...x.info.methods[key].gasData))),
      }))
      .filter(row => !opts.hideEqual || (row.min.delta && row.max.delta && row.avg.delta))
      .sort((a, b) => `${a.contract}:${a.method}` < `${b.contract}:${b.method}` ? -1 : 1);
  }
}

// Display
function center (text, length) {
  return text.padStart((text.length + length) / 2).padEnd(length);
}

function plusSign (num) {
  return num > 0 ? '+' : '';
}

function formatCmpBash (rows) {
  const contractLength = Math.max(...rows.map(({ contract }) => contract.length));
  const methodLength = Math.max(...rows.map(({ method }) => method.length));

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
    rows.map(entry => [
      '',
      chalk.grey(entry.contract.padEnd(contractLength)),
      entry.method.padEnd(methodLength),
      /* eslint-disable max-len */
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.value) ? '-' : entry.min.value.toString()).padStart(8)),
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.delta) ? '-' : plusSign(entry.min.delta) + entry.min.delta.toString()).padStart(8)),
      chalk[entry.min.delta > 0 ? 'red' : entry.min.delta < 0 ? 'green' : 'reset']((isNaN(entry.min.prcnt) ? '-' : plusSign(entry.min.prcnt) + entry.min.prcnt.toFixed(2) + '%').padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.value) ? '-' : entry.max.value.toString()).padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.delta) ? '-' : plusSign(entry.max.delta) + entry.max.delta.toString()).padStart(8)),
      chalk[entry.max.delta > 0 ? 'red' : entry.max.delta < 0 ? 'green' : 'reset']((isNaN(entry.max.prcnt) ? '-' : plusSign(entry.max.prcnt) + entry.max.prcnt.toFixed(2) + '%').padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.value) ? '-' : entry.avg.value.toString()).padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.delta) ? '-' : plusSign(entry.avg.delta) + entry.avg.delta.toString()).padStart(8)),
      chalk[entry.avg.delta > 0 ? 'red' : entry.avg.delta < 0 ? 'green' : 'reset']((isNaN(entry.avg.prcnt) ? '-' : plusSign(entry.avg.prcnt) + entry.avg.prcnt.toFixed(2) + '%').padStart(8)),
      /* eslint-enable max-len */
      '',
    ].join(' | ').trim()).join('\n'),
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
      : ':heavy_minus_sign:';
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
    rows.map(entry => [
      '',
      entry.contract,
      entry.method,
      /* eslint-disable max-len */
      (isNaN(entry.min.value) ? '-' : entry.min.value.toString()),
      (isNaN(entry.min.delta) ? '-' : plusSign(entry.min.delta) + entry.min.delta.toString()),
      (isNaN(entry.min.prcnt) ? '-' : plusSign(entry.min.prcnt) + entry.min.prcnt.toFixed(2) + '%') + trend(entry.min.delta),
      (isNaN(entry.max.value) ? '-' : entry.max.value.toString()),
      (isNaN(entry.max.delta) ? '-' : plusSign(entry.max.delta) + entry.max.delta.toString()),
      (isNaN(entry.max.prcnt) ? '-' : plusSign(entry.max.prcnt) + entry.max.prcnt.toFixed(2) + '%') + trend(entry.max.delta),
      (isNaN(entry.avg.value) ? '-' : entry.avg.value.toString()),
      (isNaN(entry.avg.delta) ? '-' : plusSign(entry.avg.delta) + entry.avg.delta.toString()),
      (isNaN(entry.avg.prcnt) ? '-' : plusSign(entry.avg.prcnt) + entry.avg.prcnt.toFixed(2) + '%') + trend(entry.avg.delta),
      /* eslint-enable max-len */
      '',
    ].join(' | ').trim()).join('\n'),
    '',
  ].join('\n').trim();
}

// MAIN
const report = Report.compare(Report.load(argv._[0]), Report.load(argv._[1]));

switch (argv.style) {
case 'markdown':
  console.log(formatCmpMarkdown(report));
  break;
case 'shell':
default:
  console.log(formatCmpBash(report));
  break;
}
