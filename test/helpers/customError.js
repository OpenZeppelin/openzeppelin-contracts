const { config } = require('hardhat');

const optimizationsEnabled = config.solidity.compilers.some(c => c.settings.optimizer.enabled);

function fail (message) {
  throw new Error(message);
}

/** Revert handler that supports custom errors. */
async function expectRevertCustomError (promise, customError, params = {}) {
  const { groups } = customError.match(/^(?<name>\w+)(\((?<args>(\w+\s+\w+)(,\s*\w+\s+\w+)*)?\))?$/) ??
    fail(`Invalid custom error "${customError}"`);

  const reason = [
    groups.name,
    '(',
    groups.args?.split(',')
      .map(p => p.split(/\s/).filter(Boolean)[1])
      .map(arg => `"${params[arg]}"` ?? fail(`Custom error "${customError}" requires "${arg}"`))
      .join(', ') ?? '',
    ')',
  ].join('');

  try {
    await promise;
    expect.fail('Expected promise to throw but it didn\'t');
  } catch (revert) {
    if (reason) {
      if (optimizationsEnabled) {
        // Optimizations currently mess with Hardhat's decoding of custom errors
        expect(revert.message).to.include.oneOf([reason, 'unrecognized return data or custom error']);
      } else {
        expect(revert.message).to.include(reason);
      }
    }
  }
};

module.exports = {
  expectRevertCustomError,
};
