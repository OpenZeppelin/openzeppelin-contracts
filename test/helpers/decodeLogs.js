const SolidityEvent = require('web3/lib/web3/event.js');

function decodeLogs (logs, events, address) {
  return logs.map(log => {
    const event = new SolidityEvent(null, events[log.topics[0]], address);
    return event.decode(log);
  });
}

module.exports = {
  decodeLogs,
};
