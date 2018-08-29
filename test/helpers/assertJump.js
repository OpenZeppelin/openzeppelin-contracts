const should = require('chai')
  .should();

async function assertJump (promise) {
  try {
    await promise;
    should.fail('Expected invalid opcode not received');
  } catch (error) {
    error.message.should.include('invalid opcode', `Expected "invalid opcode", got ${error} instead`);
  }
}

module.exports = {
  assertJump,
};
