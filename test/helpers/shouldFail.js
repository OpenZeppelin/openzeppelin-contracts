const should = require('chai')
  .should();

async function shouldFailWithMessage (promise, message) {
  try {
    await promise;
  } catch (error) {
    error.message.should.include(message, 'Wrong failure type');
    return;
  }

  should.fail(`Expected '${message} failure not received`);
}

function reverting (promise) {
  return shouldFailWithMessage(promise, 'revert');
}

async function throwing (promise) {
  return shouldFailWithMessage(promise, 'invalid opcode');
}

async function outOfGas (promise) {
  return shouldFailWithMessage(promise, 'out of gas');
}

module.exports = {
  reverting,
  throwing,
  outOfGas,
};
