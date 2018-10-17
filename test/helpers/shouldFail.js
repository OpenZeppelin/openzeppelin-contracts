const should = require('chai')
  .should();

async function shouldFailWithMessage (promise, message) {
  try {
    await promise;
  } catch (error) {
    error.message.should.include(message, 'Wrong failure type');
    return;
  }

  should.fail(`Expected '${message}' failure not received`);
}

async function reverting (promise) {
  await shouldFailWithMessage(promise, 'revert');
}

async function throwing (promise) {
  await shouldFailWithMessage(promise, 'invalid opcode');
}

async function outOfGas (promise) {
  await shouldFailWithMessage(promise, 'out of gas');
}

module.exports = {
  reverting,
  throwing,
  outOfGas,
};
