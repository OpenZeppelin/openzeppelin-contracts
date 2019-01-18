const pify = require('pify');

const ethAsync = pify(web3.eth);

module.exports = {
  ethGetBalance: ethAsync.getBalance,
  ethGetBlock: ethAsync.getBlock,
  ethGetTransactionReceipt: ethAsync.getTransactionReceipt,
  ethSendTransaction: ethAsync.sendTransaction,
};
