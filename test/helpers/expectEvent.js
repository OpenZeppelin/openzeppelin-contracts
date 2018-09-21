const should = require('chai').should();

function inLogs (logs, eventName, eventArgs = {}) {
  const event = logs.find(function (e) {
    if (e.event === eventName) {
      let matches = true;

      for (const [k, v] of Object.entries(eventArgs)) {
        if (toSimpleValue(e.args[k]) !== toSimpleValue(v)) {
          matches = false;
        }
      }

      if (matches) {
        return true;
      }
    }
  });

  should.exist(event);

  return event;
}

async function inTransaction (tx, eventName, eventArgs = {}) {
  const { logs } = await tx;
  return inLogs(logs, eventName, eventArgs);
}

function toSimpleValue (value) {
  return isBigNumber(value)
    ? value.toNumber()
    : value;
}

function isBigNumber (value) {
  return value.constructor.name === 'BigNumber';
}

module.exports = {
  inLogs,
  inTransaction,
};
