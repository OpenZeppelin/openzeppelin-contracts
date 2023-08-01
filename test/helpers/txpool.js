const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const { network } = require('hardhat');
const { promisify } = require('util');

const queue = promisify(setImmediate);

async function countPendingTransactions() {
  return parseInt(await network.provider.send('eth_getBlockTransactionCountByNumber', ['pending']));
}

async function batchInBlock(txs) {
  try {
    // disable auto-mining
    await network.provider.send('evm_setAutomine', [false]);
    // send all transactions
    const promises = txs.map(fn => fn());
    // wait for node to have all pending transactions
    while (txs.length > (await countPendingTransactions())) {
      await queue();
    }
    // mine one block
    await mine();
    // fetch receipts
    const receipts = await Promise.all(promises);
    // Sanity check, all tx should be in the same block
    const minedBlocks = new Set(receipts.map(({ receipt }) => receipt.blockNumber));
    expect(minedBlocks.size).to.equal(1);

    return receipts;
  } finally {
    // enable auto-mining
    await network.provider.send('evm_setAutomine', [true]);
  }
}

async function mineWith(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Argument to mine with is not a function');
  }
  await network.provider.send('evm_setAutomine', [false]);
  await fn();
  await network.provider.send('evm_setAutomine', [true]);
  await mine();
}

module.exports = {
  countPendingTransactions,
  batchInBlock,
  mineWith,
};
