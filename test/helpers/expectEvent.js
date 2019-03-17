const BigNumber = web3.utils.BN;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function inEvents (events, eventName, eventArgs = {}) {
  const _event = Object.values(events).find(function (e) {
    if (e.event === eventName) {
      for (const [k, v] of Object.entries(eventArgs)) {
        contains(e.returnValues, k, v);
      }
      return true;
    }
  });
  should.exist(_event);
  return _event;
}

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

async function inTransaction (tx, eventName, eventArgs = {}) {
  const { logs } = await tx;
  return inLogs(logs, eventName, eventArgs);
}

function contains (args, key, value) {
  if (args[key] == null) {
    value.should.be.equal('0x00');
  } else if (isBigNumber(args[key])) {
    args[key].toString().should.be.equal(value);
  } else {
    args[key].should.be.equal(value);
  }
}

function isBigNumber (object) {
  return object.isBigNumber ||
    object instanceof BigNumber ||
    (object.constructor && object.constructor.name === 'BigNumber');
}

module.exports = {
  inEvents,
  inLogs,
  inTransaction,
};
