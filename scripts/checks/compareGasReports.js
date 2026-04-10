#!/usr/bin/env node

import fs from 'fs';
import chalk from 'chalk';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const { argv } = yargs(hideBin(process.argv))
  .env('')
  .options({
    style: {
      type: 'string',
      choices: ['shell', 'markdown'],
      default: 'shell',
    },
    hideEqual: {
      type: 'boolean',
      default: true,
    },
    strictTesting: {
      type: 'boolean',
      default: false,
    },
  });

// Deduce base tx cost from the percentage denominator
const BASE_TX_COST = 21000;

// Utilities
// const sum = (...args) => args.reduce((a, b) => a + b, 0);
// const average = (...args)  => sum(...args) / args.length;
const variation = (current, previous, offset = 0) => ({
  value: current - offset,
  delta: current - previous,
  prcnt: (100 * (current - previous)) / (previous - offset),
});

const variations = (current, previous, offset = 0) =>
  current.min == current.max && previous.min == previous.max
    ? {
        avg: variation(current.avg, previous.avg, offset),
      }
    : {
        min: variation(current.min, previous.min, offset),
        max: variation(current.max, previous.max, offset),
        avg: variation(current.avg, previous.avg, offset),
        median: variation(current.median, previous.median, offset),
      };

// Report class
class Report {
  // Read report file
  static load(filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  // Compare two reports
  static compare(update, ref, opts = { hideEqual: true, strictTesting: false }) {
    return Object.entries(update.contracts)
      .filter(([key]) => key in ref.contracts)
      .flatMap(([key, contract]) => [
        {
          contract: contract.contractName,
          method: '[constructor]',
          ...variations(contract.deployment, ref.contracts[key].deployment, BASE_TX_COST),
        },
        ...Object.entries(contract.functions ?? {})
          .filter(([method]) => method in ref.contracts[key].functions)
          .filter(([method, data]) => !opts.strictTesting || data.count === ref.contracts[key].functions[method].count)
          .map(([method, currentData]) => ({
            contract: contract.contractName,
            method,
            ...variations(currentData, ref.contracts[key].functions[method], BASE_TX_COST),
          })),
      ])
      .sort((a, b) => `${a.contract}:${a.method}`.localeCompare(`${b.contract}:${b.method}`))
      .filter(row => !opts.hideEqual || row.min?.delta || row.max?.delta || row.avg?.delta || row.median?.delta);
  }
}

// Display
function center(text, length) {
  return text.padStart((text.length + length) / 2).padEnd(length);
}

function plusSign(num) {
  return num > 0 ? '+' : '';
}

function formatCellShell(cell) {
  const format = chalk[cell?.delta > 0 ? 'red' : cell?.delta < 0 ? 'green' : 'reset'];
  return [
    format((!isFinite(cell?.value) ? '-' : cell.value.toString()).padStart(8)),
    format((!isFinite(cell?.delta) ? '-' : plusSign(cell.delta) + cell.delta.toString()).padStart(8)),
    format((!isFinite(cell?.prcnt) ? '-' : plusSign(cell.prcnt) + cell.prcnt.toFixed(2) + '%').padStart(8)),
  ];
}

function formatCmpShell(rows) {
  const contractLength = Math.max(8, ...rows.map(({ contract }) => contract.length));
  const methodLength = Math.max(7, ...rows.map(({ method }) => method.length));

  const COLS = [
    { txt: '', length: 0 },
    { txt: 'Contract', length: contractLength },
    { txt: 'Method', length: methodLength },
    { txt: 'Min', length: 30 },
    { txt: 'Max', length: 30 },
    { txt: 'Median', length: 30 },
    { txt: 'Avg', length: 30 },
    { txt: '', length: 0 },
  ];
  const HEADER = COLS.map(entry => chalk.bold(center(entry.txt, entry.length || 0)))
    .join(' | ')
    .trim();
  const SEPARATOR = COLS.map(({ length }) => (length > 0 ? '-'.repeat(length + 2) : ''))
    .join('|')
    .trim();

  return [
    '',
    HEADER,
    ...rows.map(entry =>
      [
        '',
        chalk.grey(entry.contract.padEnd(contractLength)),
        entry.method.padEnd(methodLength),
        ...formatCellShell(entry.min),
        ...formatCellShell(entry.max),
        ...formatCellShell(entry.median),
        ...formatCellShell(entry.avg),
        '',
      ]
        .join(' | ')
        .trim(),
    ),
    '',
  ]
    .join(`\n${SEPARATOR}\n`)
    .trim();
}

function alignPattern(align) {
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

function trend(value) {
  return value > 0 ? ':x:' : value < 0 ? ':heavy_check_mark:' : ':heavy_minus_sign:';
}

function formatCellMarkdown(cell) {
  return [
    !isFinite(cell?.value) ? '-' : cell.value.toString(),
    !isFinite(cell?.delta) ? '-' : plusSign(cell.delta) + cell.delta.toString(),
    !isFinite(cell?.prcnt) ? '-' : plusSign(cell.prcnt) + cell.prcnt.toFixed(2) + '% ' + trend(cell.delta),
  ];
}

function formatCmpMarkdown(rows) {
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
  const HEADER = COLS.map(entry => entry.txt)
    .join(' | ')
    .trim();
  const SEPARATOR = COLS.map(entry => (entry.txt ? alignPattern(entry.align) : ''))
    .join('|')
    .trim();

  return [
    '# Changes to gas costs',
    '',
    HEADER,
    SEPARATOR,
    rows
      .map(entry =>
        [
          '',
          entry.contract,
          entry.method,
          ...formatCellMarkdown(entry.min),
          ...formatCellMarkdown(entry.max),
          ...formatCellMarkdown(entry.avg),
          '',
        ]
          .join(' | ')
          .trim(),
      )
      .join('\n'),
    '',
  ]
    .join('\n')
    .trim();
}

// MAIN
const report = Report.compare(Report.load(argv._[0]), Report.load(argv._[1]), argv);

switch (argv.style) {
  case 'markdown':
    console.log(formatCmpMarkdown(report));
    break;
  case 'shell':
  default:
    console.log(formatCmpShell(report));
    break;
}
