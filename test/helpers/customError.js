const { config } = require('hardhat');
const { expect } = require('chai');

const optimizationsEnabled = config.solidity.compilers.some(c => c.settings.optimizer.enabled);

/** Revert handler that supports custom errors. */
async function expectRevertCustomError(promise, expectedErrorName, args) {
  try {
    await promise;
    expect.fail("Expected promise to throw but it didn't");
  } catch (revert) {
    if (!Array.isArray(args)) {
      expect.fail('Expected 3rd array parameter for error arguments');
    }
    if (expectedErrorName) {
      if (optimizationsEnabled) {
        // Optimizations currently mess with Hardhat's decoding of custom errors
        expect(revert.message).to.include.oneOf([expectedErrorName, 'unrecognized return data or custom error']);
      } else {
        // The revert message for custom errors looks like:
        // VM Exception while processing transaction:
        // reverted with custom error 'InvalidAccountNonce("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 0)'

        // We trim out anything inside the single quotes as comma-separated values
        const [, error] = revert.message.match(/'(.*)'/);

        // Attempt to parse as an error
        if (!/\w+\(.*\)/g.test(error)) {
          expect.fail(`Couldn't parse "${error}" as a custom error`);
        }

        // Extract the error name
        const [, errorName] = error.match(/(\w+)\(.*\)/);

        const argMatches = [
          ...error
            // Remove the error name and leave the parameters
            .replace(errorName, '')
            // Capture the remaining parameters
            .matchAll(/(0x[0-9A-Fa-f]+|-?\d+|\w+)/g),
        ];

        // Assert error name
        expect(errorName).to.be.equal(
          expectedErrorName,
          `Unexpected custom error name (with found args: [${argMatches.map(([a]) => a)}])`,
        );

        // Coerce to string for comparison since `arg` can be either a number or hex.
        const sanitizedExpected = args.map(arg => arg.toString().toLowerCase());
        const sanitizedActual = argMatches.map(([arg]) => arg.toString().toLowerCase());

        // Assert argument equality
        expect(sanitizedActual).to.have.members(sanitizedExpected, `Unexpected ${errorName} arguments`);
      }
    }
  }
}

module.exports = {
  expectRevertCustomError,
};
