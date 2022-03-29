/** Revert handler that supports custom errors. */
async function expectRevertCustomError(promise, reason) {
  try {
    await promise;
    expect.fail('Expected promise to throw but it didn\'t');
  } catch (revert) {
    if (reason) {
      expect(revert.message).to.include(reason);
    }
  }
};

module.exports = {
  expectRevertCustomError,
};
