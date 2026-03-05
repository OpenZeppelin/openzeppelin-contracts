const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  return {
    mock: await ethers.deployContract('$BlockHeader'),
  };
}

describe('BlockHeader', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  for (const block of [
    {
      _version: 'osaka',
      _rlpEncoded:
        '0xf90281a031d473c19b8e0d89e0546d057506d9dea042cd1492ef90682134e6027cf8669ca01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794dadb0d80178819f2319190d340ce9a924f783711a05ac60aff31a075d3d53eea5b040cc8f753bde9e107558eec5fe17df8bc110b12a08d49818fb50fbdf89c471f303685b1bdc506d824b5edc291f74a234f74a73758a0fdb89e5c12a2dca6f1d213dd82d69ec07afa07a3e1aeb76f9aac2c3a0a98f01cb90100fffffff7ffffff7ffeffffffffffffbbff7fff7edfb7fffffffffdfffffbefffb7dffdfffffffffffbf7ffffdffff7ffffffffffffbffffffffffffffffffffffeffbfffffffeffffffefffffffffdfffffffffffffffffffffffffffffffefffffffffffffffffffffffffffef7fffff7feffffffffffffbfffffff7fffffbffffffffffffffffffffffffffffff76ffefffffff7fff7bffffffffdfff7fffffffffffffbfffffefef7fffdbffffdffffefceffffffffffffffffbffdfffffffffffefffffffbffbfffffffff7fbf7ffffffffffeffffdfffffdffffffeffffffffffff7fff77ffffffffffffffffffffffffeb7fffffffffffff7ff7ffffff80840177396d84039386c784037dbb0e8469a95c3b934275696c6465724e6574202842656176657229a0f10bbd059504a06792efabaaca4af22f285ce028d54a60f9a65ea25db70eed2d8800000000000000008408342539a06bb47e5be135671fde5284a24b5f5dd933f90bb7fdb22aa764f120bdc55d164f83200000840af13e4da066573e435a75fed7dfab9b037bb87bfa2ca01e7a4914c7178145e8a9d1eba444a0e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      hash: '0x0f23d6dee77755efe485b0870d820b1aae8cfe689d767ce7d10b6afa2b1ef14d',
      parentHash: '0x31d473c19b8e0d89e0546d057506d9dea042cd1492ef90682134e6027cf8669c',
      sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      miner: '0xdadb0d80178819f2319190d340ce9a924f783711',
      stateRoot: '0x5ac60aff31a075d3d53eea5b040cc8f753bde9e107558eec5fe17df8bc110b12',
      transactionsRoot: '0x8d49818fb50fbdf89c471f303685b1bdc506d824b5edc291f74a234f74a73758',
      receiptsRoot: '0xfdb89e5c12a2dca6f1d213dd82d69ec07afa07a3e1aeb76f9aac2c3a0a98f01c',
      logsBloom:
        '0xfffffff7ffffff7ffeffffffffffffbbff7fff7edfb7fffffffffdfffffbefffb7dffdfffffffffffbf7ffffdffff7ffffffffffffbffffffffffffffffffffffeffbfffffffeffffffefffffffffdfffffffffffffffffffffffffffffffefffffffffffffffffffffffffffef7fffff7feffffffffffffbfffffff7fffffbffffffffffffffffffffffffffffff76ffefffffff7fff7bffffffffdfff7fffffffffffffbfffffefef7fffdbffffdffffefceffffffffffffffffbffdfffffffffffefffffffbffbfffffffff7fbf7ffffffffffeffffdfffffdffffffeffffffffffff7fff77ffffffffffffffffffffffffeb7fffffffffffff7ff7ffffff',
      difficulty: '0x0',
      number: '0x177396d',
      gasLimit: '0x39386c7',
      gasUsed: '0x37dbb0e',
      timestamp: '0x69a95c3b',
      extraData: '0x4275696c6465724e6574202842656176657229',
      mixHash: '0xf10bbd059504a06792efabaaca4af22f285ce028d54a60f9a65ea25db70eed2d',
      nonce: '0x0000000000000000',
      baseFeePerGas: '0x8342539',
      withdrawalsRoot: '0x6bb47e5be135671fde5284a24b5f5dd933f90bb7fdb22aa764f120bdc55d164f',
      blobGasUsed: '0x200000',
      excessBlobGas: '0xaf13e4d',
      parentBeaconBlockRoot: '0x66573e435a75fed7dfab9b037bb87bfa2ca01e7a4914c7178145e8a9d1eba444',
      requestsHash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  ]) {
    it(`should parse block #${Number(block.number)} correctly`, async function () {
      const headerRLP = block._rlpEncoded;
      await expect(this.mock.$getParentHash(headerRLP)).to.eventually.equal(block.parentHash);
      await expect(this.mock.$getOmmersHash(headerRLP)).to.eventually.equal(block.sha3Uncles);
      await expect(this.mock.$getCoinbase(headerRLP)).to.eventually.equal(ethers.getAddress(block.miner));
      await expect(this.mock.$getStateRoot(headerRLP)).to.eventually.equal(block.stateRoot);
      await expect(this.mock.$getTransactionsRoot(headerRLP)).to.eventually.equal(block.transactionsRoot);
      await expect(this.mock.$getReceiptsRoot(headerRLP)).to.eventually.equal(block.receiptsRoot);
      await expect(this.mock.$getLogsBloom(headerRLP)).to.eventually.equal(block.logsBloom);
      await expect(this.mock.$getDifficulty(headerRLP)).to.eventually.equal(block.difficulty);
      await expect(this.mock.$getNumber(headerRLP)).to.eventually.equal(block.number);
      await expect(this.mock.$getGasLimit(headerRLP)).to.eventually.equal(block.gasLimit);
      await expect(this.mock.$getGasUsed(headerRLP)).to.eventually.equal(block.gasUsed);
      await expect(this.mock.$getTimestamp(headerRLP)).to.eventually.equal(block.timestamp);
      await expect(this.mock.$getExtraData(headerRLP)).to.eventually.equal(block.extraData);
      await expect(this.mock.$getPrevRandao(headerRLP)).to.eventually.equal(block.mixHash);
      await expect(this.mock.$getNonce(headerRLP)).to.eventually.equal(block.nonce);
      await expect(this.mock.$getBaseFeePerGas(headerRLP)).to.eventually.equal(block.baseFeePerGas);
      await expect(this.mock.$getWithdrawalsRoot(headerRLP)).to.eventually.equal(block.withdrawalsRoot);
      await expect(this.mock.$getBlobGasUsed(headerRLP)).to.eventually.equal(block.blobGasUsed);
      await expect(this.mock.$getExcessBlobGas(headerRLP)).to.eventually.equal(block.excessBlobGas);
      await expect(this.mock.$getParentBeaconBlockRoot(headerRLP)).to.eventually.equal(block.parentBeaconBlockRoot);
      await expect(this.mock.$getRequestsHash(headerRLP)).to.eventually.equal(block.requestsHash);
    });
  }
});
