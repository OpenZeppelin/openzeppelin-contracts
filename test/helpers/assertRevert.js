const should = require('chai')
  .should();

async function assertRevert (promise) {
  try {
    await promise;
  } catch (error) {
    error.message.should.include('revert', `Expected "revert", got ${error} instead`);
    return;
  }
  should.fail('Expected revert not received');
}

module.exports = {
  assertRevert,
};
