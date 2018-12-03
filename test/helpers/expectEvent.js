const SolidityEvent = require('web3/lib/web3/event.js');
const { ethGetTransactionReceipt } = require('./web3');

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function inLogs (logs, eventName, eventArgs = {}) {
  const event = logs.find(function (e) {
    if (e.event === eventName) {
      for (const [k, v] of Object.entries(eventArgs)) {
        contains(e.args, k, v);
      }
      return true;
    }
  });
  should.exist(event);
  return event;
}

async function inConstruction (contract, eventName, eventArgs = {}) {
  return inTransaction(contract.transactionHash, contract.constructor, eventName, eventArgs);
}

async function inTransaction (txHash, emitter, eventName, eventArgs = {}) {
  const receipt = await ethGetTransactionReceipt(txHash);
  const logs = decodeLogs(receipt.logs, emitter.events);

  return inLogs(logs, eventName, eventArgs);
}

function contains (args, key, value) {
  if (isBigNumber(args[key])) {
    args[key].should.be.bignumber.equal(value);
  } else {
    args[key].should.be.equal(value);
  }
}

function isBigNumber (object) {
  return object.isBigNumber ||
    object instanceof BigNumber ||
    (object.constructor && object.constructor.name === 'BigNumber');
}

function decodeLogs (logs, events) {
  return Array.prototype.concat(...logs.map(log =>
    log.topics.filter(topic => topic in events).map(topic => {
      const event = new SolidityEvent(null, events[topic], 0);
      return event.decode(log);
    })
  ));
}

module.exports = {
  inLogs,
  inConstruction,
  inTransaction,
};
