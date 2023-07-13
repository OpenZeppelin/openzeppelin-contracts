const { expect } = require('chai');

/** Revert handler that supports custom errors. */
async function expectRevertCustomError(promise, expectedErrorName, args) {
  if (!Array.isArray(args)) {
    expect.fail('Expected 3rd array parameter for error arguments');
  }

  await promise.then(
    () => expect.fail("Expected promise to throw but it didn't"),
    ({ message }) => {
      // The revert message for custom errors looks like:
      // VM Exception while processing transaction:
      // reverted with custom error 'InvalidAccountNonce("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 0)'

      // Attempt to parse as a custom error
      const match = message.match(/custom error '(?<name>\w+)\((?<args>.*)\)'/);
      if (!match) {
        expect.fail(`Could not parse as custom error. ${message}`);
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
    },
  );
}

module.exports = {
  expectRevertCustomError,
};
