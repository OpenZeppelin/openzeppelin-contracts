const clock = () => web3.eth.getBlock('latest').then(block => block.number);
clock.blockNumber = clock;
clock.timestamp = () => web3.eth.getBlock('latest').then(block => block.timestamp);

const clockFromReceipt = receipt => Promise.resolve(receipt.blockNumber);
clockFromReceipt.blockNumber = clockFromReceipt;
clockFromReceipt.timestamp = receipt => web3.eth.getBlock(receipt.blockNumber).then(block => block.timestamp);

module.exports = {
  clock,
  clockFromReceipt,
};
