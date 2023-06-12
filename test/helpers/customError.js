const { expect } = require('chai');

/** Revert handler that supports custom errors. */
async function expectRevertCustomError(promise, expectedErrorName, args) {
  try {
    await promise;
    expect.fail("Expected promise to throw but it didn't");
  } catch (revert) {
    if (!Array.isArray(args)) {
      expect.fail('Expected 3rd array parameter for error arguments');
    }
    // The revert message for custom errors looks like:
    // VM Exception while processing transaction:
    // reverted with custom error 'InvalidAccountNonce("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 0)'

    // We trim out anything inside the single quotes as comma-separated values
    const [, error] = revert.message.match(/'(.*)'/);

    // Attempt to parse as an error
    const match = error.match(/(?<name>\w+)\((?<args>.*)\)/);
    if (!match) {
      expect.fail(`Couldn't parse "${error}" as a custom error`);
    }
    // Extract the error name and parameters
    const errorName = match.groups.name;
    const argMatches = [...match.groups.args.matchAll(/-?\w+/g)];

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

module.exports = {
  expectRevertCustomError,
};
