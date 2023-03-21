module.exports = {
  norpc: true,
  testCommand: 'npm test',
  compileCommand: 'npm run compile',
  skipFiles: ['mocks'],
  providerOptions: {
    default_balance_ether: '10000000000000000000000000',
  },
  istanbulReporter: ['html'],
  mocha: {
    fgrep: '[skip-on-coverage]',
    invert: true,
  },
};
