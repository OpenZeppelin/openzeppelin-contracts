const SolidityEvent = require('web3/lib/web3/event.js');

export default function decodeLogs (logs, contract, address) {
  return logs.map(log => {
    const event = new SolidityEvent(null, contract.events[log.topics[0]], address);
    return event.decode(log);
  });
}
