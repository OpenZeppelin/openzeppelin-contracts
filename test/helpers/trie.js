const { ethers } = require('ethers');
const { MerklePatriciaTrie, createMerkleProof } = require('@ethereumjs/mpt');

class BlockTries {
  constructor(block) {
    this.block = block;

    this.transactionTrie = new MerklePatriciaTrie();
    this.receiptTrie = new MerklePatriciaTrie();

    this._ready = Promise.all(
      block.transactions.map(hash =>
        block
          .getTransaction(hash)
          .then(async tx => [tx, await tx.wait()])
          .then(([tx, receipt]) =>
            Promise.all([
              // Transaction
              this.transactionTrie.put(BlockTries.indexToKeyBytes(receipt.index), BlockTries.serializeTransaction(tx)),
              // Receipt
              this.receiptTrie.put(BlockTries.indexToKeyBytes(receipt.index), BlockTries.serializeReceipt(receipt)),
            ]),
          ),
      ),
    ).then(() => this);
  }

  ready() {
    return this._ready;
  }

  getTransactionProof(index) {
    return createMerkleProof(this.transactionTrie, BlockTries.indexToKeyBytes(index));
  }

  getReceiptProof(index) {
    return createMerkleProof(this.receiptTrie, BlockTries.indexToKeyBytes(index));
  }

  get transactionTrieRoot() {
    return ethers.hexlify(this.transactionTrie.root());
  }

  get receiptTrieRoot() {
    return ethers.hexlify(this.receiptTrie.root());
  }

  static from(block) {
    return new BlockTries(block);
  }

  // Serialize a transaction into its RLP encoded form
  static serializeTransaction(tx) {
    return ethers.Transaction.from(tx).serialized;
  }

  // Serialize a receipt into its RLP encoded form
  static serializeReceipt(receipt) {
    return ethers.concat([
      receipt.type === 0 ? '0x' : ethers.toBeHex(receipt.type),
      ethers.encodeRlp([
        receipt.status === 0 ? '0x' : '0x01',
        ethers.toBeHex(receipt.cumulativeGasUsed),
        receipt.logsBloom,
        receipt.logs.map(log => [log.address, log.topics, log.data]),
      ]),
    ]);
  }

  static indexToKey(index) {
    return ethers.encodeRlp(ethers.stripZerosLeft(ethers.toBeHex(index)));
  }

  static indexToKeyBytes(index) {
    return ethers.getBytes(BlockTries.indexToKey(index));
  }
}

module.exports = { BlockTries };
