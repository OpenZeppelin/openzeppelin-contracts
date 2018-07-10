const pify = require('pify');

const ethAsync = pify(web3.eth);

export const ethGetBalance = ethAsync.getBalance;
export const ethSendTransaction = ethAsync.sendTransaction;
export const ethGetBlock = ethAsync.getBlock;
