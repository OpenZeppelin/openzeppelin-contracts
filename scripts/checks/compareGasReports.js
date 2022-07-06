#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const { _: params } = require('yargs').argv;

// Deduce bas tx cost from the percentage denominator
const BASE_TX_COST = 21000;

// Report format
const COLS = [
  { txt: '', length: 0 },
  { txt: 'Contract', length: 40 },
  { txt: 'Method', length: 20 },
  { txt: 'Min', length: 30 },
  { txt: 'Max', length: 30 },
  { txt: 'Avg', length: 30 },
  { txt: '', length: 0 },
];

const HEADER = COLS.map(entry => chalk.bold(center(entry.txt, entry.length || 0))).join(' | ').trim();
const SEPARATOR = COLS.map(({ length }) => length > 0 ? '-'.repeat(length + 2) : '').join('|').trim();

// Utilities
function zip (...args) {
  return Array(Math.max(...args.map(arg => arg.length))).fill(null).map((_, i) => args.map(arg => arg[i]));
}

function unique (array, op = x => x) {
  return array.filter((obj, i) => array.findIndex(entry => op(obj) === op(entry)) === i);
}

function center (text, length) {
  return text.padStart((text.length + length) / 2).padEnd(length);
}

function diffString (to, from) {
  const delta = to - from;
  const percentage = 100 * delta / (from - BASE_TX_COST);
  const string = [
    isNaN(to) ? '-' : to,
    isNaN(delta) ? '-' : (delta > 0 ? '+' : '') + delta,
    isNaN(percentage) ? '-' : (percentage > 0 ? '+' : '') + percentage.toFixed(2) + '%',
  ].map(x => x.toString().padStart(10)).join('');

  return isNaN(delta) || delta === 0
    ? chalk.grey(string)
    : delta > 0
      ? chalk.bold.red(string)
      : chalk.bold.green(string);
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
    for (const method of data.matchAll(/([·|]\s+([a-zA-Z0-9.-]+)\s+){7}/g)) {
      const params = method[0].matchAll(/([a-zA-Z0-9.-]+)/g);
      const contract = params.next().value[0];
      const name = params.next().value[0];
      const min = Number(params.next().value[0]);
      const max = Number(params.next().value[0]);
      const avg = Number(params.next().value[0]);
      report[contract] = report[contract] || [];
      report[contract].push({ name, min, max, avg });
    }
    return report;
  }

  // Compare two reports
  static compare (update, ref, opts = { hideEqual: false }) {
    // For each contract in the new report
    // ... if the contract exist in the old report
    // ... ... for all (unique) function names in the contract
    // ... ... zip the corresponding function from the old and new report
    // ... ... skip the function doesn't exist in either contract
    // ... ... skip if the report are identical and if we have the hideEqual option
    // ... ... generate the log line
    // ... ... join the log lines and trim contracts for which there is no change
    const rows = Object.keys(update)
      .filter(contract => ref[contract])
      .map(contract => unique(update[contract]
        .map(({ name }) => name))
        .flatMap(name => zip(
          update[contract].filter(entry => entry.name === name),
          ref[contract].filter(entry => entry.name === name),
        ))
        .filter(([ current, previous ]) => current && previous)
        .filter(([ current, previous ]) => !opts.hideEqual || JSON.stringify(current) !== JSON.stringify(previous))
        .map(([ current, previous ]) =>
          [
            '',
            chalk.grey(contract.padEnd(40)),
            current.name.padEnd(20),
            diffString(current.min, previous.min),
            diffString(current.max, previous.max),
            diffString(current.avg, previous.avg),
            '',
          ].join(' | ').trim())
        .join('\n'))
      .filter(Boolean);

    return [ '', HEADER, ...rows, '' ].join(`\n${SEPARATOR}\n`).trim();
  }
}

// MAIN
console.log(Report.compare(Report.load(params[0]), Report.load(params[1])));
