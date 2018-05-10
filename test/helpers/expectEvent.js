const should = require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const inLogs = async (logs, eventName, eventArgs = {}) => {
  const event = logs.find(e => e.event === eventName);
  should.exist(event);
  for (const [k, v] of Object.entries(eventArgs)) {
    should.exist(event.args[k]);
    if (web3._extend.utils.isBigNumber(event.args[k])) {
      event.args[k].should.be.bignumber.eq(v);
    } else {
      event.args[k].should.eq(v);
    }
  }
  return event;
};

const inTransaction = async (tx, eventName, eventArgs = {}) => {
  const { logs } = await tx;
  return inLogs(logs, eventName, eventArgs);
};

module.exports = {
  inLogs,
  inTransaction,
};
