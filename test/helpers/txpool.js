const { network } = require('hardhat');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const { unique } = require('./iterate');

async function batchInBlock(txs) {
  try {
    // disable auto-mining
    await network.provider.send('evm_setAutomine', [false]);
    // send all transactions
    const responses = await Promise.all(txs.map(fn => fn()));
    // mine one block
    await mine();
    // fetch receipts
    const receipts = await Promise.all(responses.map(response => response.wait()));
    // Sanity check, all tx should be in the same block
    expect(unique(receipts.map(receipt => receipt.blockNumber))).to.have.lengthOf(1);
    // return responses
    return receipts;
  } finally {
    // enable auto-mining
    await network.provider.send('evm_setAutomine', [true]);
  }
}

module.exports = {
  batchInBlock,
};
