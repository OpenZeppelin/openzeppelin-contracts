const { should } = require('./setup');
const Failer = artifacts.require('Failer');

async function shouldFailWithMessage (promise, message) {
  try {
    await promise;
  } catch (error) {
    if (message) {
      error.message.should.include(message, `Wrong failure type, expected '${message}'`);
    }
    return;
  }

  should.fail('Expected failure not received');
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

async function shouldFail (promise) {
  await shouldFailWithMessage(promise);
}

async function withMessage (promise, message) {
  // First, let's find out if current version of Ganache (or testrpc-sc)
  // supports revert reason by reverting deliberately and then catching and inspecting
  // thrown error.
  try {
    const failer = await Failer.new();
    await failer.failWithRevertVocally();
  } catch (error) {
    if (error.message.includes('Doomed to fail')) {
      // Current Ganache supports reason string. Proceed with revert reason
      // assertion.
      return shouldFailWithMessage(promise, message);
    } else if (error.message.includes('revert')) {
      // Current version does NOT support reason string. Fall back to regular
      // revert assertion.
      return reverting(promise);
    }
  }
  should.fail('This line should be unreachable');
}

shouldFail.reverting = reverting;
shouldFail.reverting.withMessage = withMessage;
shouldFail.throwing = throwing;
shouldFail.outOfGas = outOfGas;

module.exports = shouldFail;
