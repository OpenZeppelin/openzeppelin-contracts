async function assertRevert (promise) {
  try {
    await promise;
    throw new Error('Transaction succeeded when it shouldn\'t have');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
}

module.exports = {
  assertRevert,
};
