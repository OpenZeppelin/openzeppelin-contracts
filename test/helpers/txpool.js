const { network } = require('hardhat');
const { expect } = require('chai');

const { unique } = require('./iterate');

async function batchInBlock(txs, provider = network.provider) {
  try {
    // disable auto-mining
    await provider.send('evm_setAutomine', [false]);
    // send all transactions
    const responses = await Promise.all(txs.map(fn => fn()));
    // mine one block
    await provider.send('evm_mine');
    // fetch receipts
    const receipts = await Promise.all(responses.map(response => response.wait()));
    // Sanity check, all tx should be in the same block
    expect(unique(receipts.map(receipt => receipt.blockNumber))).to.have.lengthOf(1);
    // return responses
    return receipts;
  } finally {
    // enable auto-mining
    await provider.send('evm_setAutomine', [true]);
  }
}

module.exports = {
  batchInBlock,
};
