#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');

const { hideBin } = require('yargs/helpers');
const { argv } = require('yargs/yargs')(hideBin(process.argv))
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
function sum(...args) {
  return args.reduce((a, b) => a + b, 0);
}

function average(...args) {
  return sum(...args) / args.length;
}

function variation(current, previous, offset = 0) {
  return {
    value: current,
    delta: current - previous,
    prcnt: (100 * (current - previous)) / (previous - offset),
  };
}

// Report class
class Report {
  // Read report file
  static load(filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  // Compare two reports
  static compare(update, ref, opts = { hideEqual: true, strictTesting: false }) {
    if (JSON.stringify(update.options?.solcInfo) !== JSON.stringify(ref.options?.solcInfo)) {
      console.warn('WARNING: Reports produced with non matching metadata');
    }

    // gasReporter 1.0.0 uses ".info", but 2.0.0 uses ".data"
    const updateInfo = update.info ?? update.data;
    const refInfo = ref.info ?? ref.data;

    const deployments = updateInfo.deployments
      .map(contract =>
        Object.assign(contract, { previousVersion: refInfo.deployments.find(({ name }) => name === contract.name) }),
      )
      .filter(contract => contract.gasData?.length && contract.previousVersion?.gasData?.length)
      .flatMap(contract => [
        {
          contract: contract.name,
          method: '[bytecode length]',
          avg: variation(contract.bytecode.length / 2 - 1, contract.previousVersion.bytecode.length / 2 - 1),
        },
        {
          contract: contract.name,
          method: '[construction cost]',
          avg: variation(
            ...[contract.gasData, contract.previousVersion.gasData].map(x => Math.round(average(...x))),
            BASE_TX_COST,
          ),
        },
      ])
      .sort((a, b) => `${a.contract}:${a.method}`.localeCompare(`${b.contract}:${b.method}`));

    const methods = Object.keys(updateInfo.methods)
      .filter(key => refInfo.methods[key])
      .filter(key => updateInfo.methods[key].numberOfCalls > 0)
      .filter(
        key => !opts.strictTesting || updateInfo.methods[key].numberOfCalls === refInfo.methods[key].numberOfCalls,
      )
      .map(key => ({
        contract: refInfo.methods[key].contract,
        method: refInfo.methods[key].fnSig,
        min: variation(...[updateInfo, refInfo].map(x => Math.min(...x.methods[key].gasData)), BASE_TX_COST),
        max: variation(...[updateInfo, refInfo].map(x => Math.max(...x.methods[key].gasData)), BASE_TX_COST),
        avg: variation(...[updateInfo, refInfo].map(x => Math.round(average(...x.methods[key].gasData))), BASE_TX_COST),
      }))
      .sort((a, b) => `${a.contract}:${a.method}`.localeCompare(`${b.contract}:${b.method}`));

    return []
      .concat(deployments, methods)
      .filter(row => !opts.hideEqual || row.min?.delta || row.max?.delta || row.avg?.delta);
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
