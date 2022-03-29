const { expectRevert } = require('@openzeppelin/test-helpers');

/** Revert handler that supports custom errors. */
expectRevert.customError = async function (promise, reason) {
  try {
    await promise;
    expect.fail('Expected promise to throw but it didn\'t');
  } catch (error) {
    if (reason) {
      expect(error.message).to.include(reason);
    }
  }
};

module.exports = {
  expectRevert,
};
