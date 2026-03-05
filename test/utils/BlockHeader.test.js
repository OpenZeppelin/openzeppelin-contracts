const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, mine } = require('@nomicfoundation/hardhat-network-helpers');
const { Enum } = require('../helpers/enums');

const HeaderField = Enum(
  'ParentHash', // Since Frontier
  'OmmersHash', // Since Frontier
  'Coinbase', // Since Frontier
  'StateRoot', // Since Frontier
  'TransactionsRoot', // Since Frontier
  'ReceiptsRoot', // Since Frontier
  'LogsBloom', // Since Frontier
  'Difficulty', // Since Frontier
  'Number', // Since Frontier
  'GasLimit', // Since Frontier
  'GasUsed', // Since Frontier
  'Timestamp', // Since Frontier
  'ExtraData', // Since Frontier
  'PrevRandao', // Since Frontier (called MixHash before Paris)
  'Nonce', // Since Frontier
  'BaseFeePerGas', // Since London
  'WithdrawalsRoot', // Since Shanghai
  'BlobGasUsed', // Since Cancun
  'ExcessBlobGas', // Since Cancun
  'ParentBeaconBlockRoot', // Since Cancun
  'RequestsHash', // Since Prague
  'BlockAccessListHash', // Since Amsterdam
);

const sanitize = hex => (hex === undefined ? undefined : hex === '0x0' ? '0x' : ethers.toBeHex(hex));
const rlpEncodeBlock = block =>
  ethers.encodeRlp(
    [
      block.parentHash,
      block.sha3Uncles,
      block.miner,
      block.stateRoot,
      block.transactionsRoot,
      block.receiptsRoot,
      block.logsBloom,
      sanitize(block.difficulty),
      sanitize(block.number),
      sanitize(block.gasLimit),
      sanitize(block.gasUsed),
      sanitize(block.timestamp),
      block.extraData,
      block.mixHash,
      block.nonce,
      sanitize(block.baseFeePerGas),
      block.withdrawalsRoot,
      sanitize(block.blobGasUsed),
      sanitize(block.excessBlobGas),
      block.parentBeaconBlockRoot,
      block.requestsHash,
    ].filter(x => x !== undefined),
  ); // filter out fields not present in older blocks

async function fixture() {
  return {
    mock: await ethers.deployContract('$BlockHeader'),
  };
}

describe('BlockHeader', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('current block', async function () {
    const block = await ethers.provider.send('eth_getBlockByNumber', ['latest', false]);
    const headerRLP = rlpEncodeBlock(block);

    // encoding sanity check
    expect(ethers.keccak256(headerRLP)).to.equal(block.hash);

    // validate inclusion
    await mine(1); // ensure blockhash is available
    await expect(this.mock.$verifyBlockHeader(headerRLP)).to.eventually.be.true;

    // parsing check
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

  describe('historical blocks', function () {
    for (const block of [
      {
        hash: '0x244dd4312575b2c8846837086cf4f1669d026f1db376d1ad700ed77782c11b75',
        parentHash: '0x9b2a40b705d5d806ede8764de1b628e43d98df93dfe779e5f8d9fdb51c6c3e5e',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        miner: '0xd224ca0c819e8e97ba0136b3b95ceff503b79f53',
        stateRoot: '0x78cc9771fd6eb41a7bb869e5bc186fd42323cf352caa1d5a6088977c90e8f1af',
        transactionsRoot: '0xa8615e34921ad24e27a437eafe0336c3d390d35ed8e04f5932ef32ddc19bcc6b',
        receiptsRoot: '0xb4d7b1832dd9501bb975e74c16e7b22088c620f6afcd0509fc8016aaecf13e19',
        logsBloom:
          '0xd7b7fba609e4a0b8909bae66c339fe308802f55c009adeb842091c7e2ee296bc289738e45cb0b5d0cc4bdb175261a90bde166987edbab1fa63d0dbaec37cf98200c1e008b9009e12ce1196ab3ba86af49411e29dd7ec8110fd5281f0c3f9d5509bb689466fa79f8f4109dc06c900cef93721b67c15589e4468effd9ea010d8c8e802e1ba0ff12614c7421b4d276317b7b95f3fc1f7fa81fe69563d6a02993f9637fb08cd12aebdfabdd905c2d408d4291fe660b928035a8de171aeb95d5e00e1727d21a233f81063a492d322e5cc1d75ad68bf873f8f143c78ca90e709ba6ce58d18213b84057b51af510e202096e59435f4e86447feb8dd9cfc37068d836b64',
        difficulty: '0x19824c721603ce',
        number: '0xbc6140',
        gasLimit: '0xe34a80',
        gasUsed: '0xe300f7',
        timestamp: '0x608cc067',
        extraData: '0x7575706f6f6c2e636e2d32',
        mixHash: '0x6b6af59fde87c4b4750bedc93f76a7c330087c11784a344fb3c7948308f05112',
        nonce: '0xb3b2502a8c3de6f2',
      },
      {
        hash: '0xbd44f309a77f0eeca1f0fb8d0fee0663ca024cb46c2e6fa8f5eee77f0259b7d5',
        parentHash: '0xa7d38804924d37bcc5dff91167ac797aa4721a2d4235f433f12598219b5eee93',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        miner: '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c',
        stateRoot: '0x938dffb3b445ae76f354166681a514cc274087734b2bd1e1b4d84c9eb3507ead',
        transactionsRoot: '0x00ee8734e436cee128d0ade5fdab24b31ab9403c0a93951195dbee98822a169d',
        receiptsRoot: '0xb227d8104c677943a50b33f142e9582bbc408d7e758cc4c4e8947f33f8665d65',
        logsBloom:
          '0x777673cfe7da9fd71084a5b3c37bbb77d22cf9f9f975f26238bfe5c29c67d57d499e95a7c6dafb7ed192d99ed59f9f4f1644c6dbffc7bf9bb6fe2ea9657e7e0fbecb78bf0f251d2ffcdb0abf117b6ff1bfacb27c97def1cdfbc4f66fd17137b2db1b7bbdbfd9476fd7f6dbbe0d24eada329cd779784c9efa7b2ff7b7f7fcce2978fde77bb35567738c53354b3b0fe69dc457fe3fbbf67a3d98f135ffc9172faaf31adfdba9ebed926e97e19fff31e2f79ade9b2dbae386dfc4f596ee5d4d5dd7319d876b6e0a9ded78c8c507f63964d6bb979bef9f2f34db4e73b2c31a0767f409bf763bdba1d0019ab55729d7ec90c4597c8f57e4903d5c67e6fa0756ee717f',
        difficulty: '0x1fb6d0dbf2e1e5',
        number: '0xca1d48',
        gasLimit: '0x1ca35b6',
        gasUsed: '0x1ca1799',
        timestamp: '0x61450e8c',
        extraData: '0xd883010a08846765746888676f312e31362e38856c696e7578',
        mixHash: '0x2a71012cea7e7ef11d4e7bf39e5b395dbb372498922b942ab157e070f4723814',
        nonce: '0x6fbf46080346a66a',
        baseFeePerGas: '0xa9558cdb7',
      },
      {
        hash: '0x82b4ead321f2f3891e11990f109b9e17cc39a4ffd7aeb64b8e2c9ecad6a8dcdc',
        parentHash: '0xa920c05e272e83f10ee97d8bd809986a9fa036d9e245682fce503ecb435b0bc1',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        miner: '0x1f9090aae28b8a3dceadf281b0f12828e676c326',
        stateRoot: '0xeaf528d4e0b9f4355cac7c6ed22502a23672e3ace4cc9901c8aa0fca658e67c0',
        transactionsRoot: '0x3765c52b95c470d869706b1c422938c5c86387846dbae3df8f5335a1c4f53d72',
        receiptsRoot: '0xcafb926aaa7a4ebc4c7c234ec03e94c1e3eef8dba377c93d768f88351542dcec',
        logsBloom:
          '0x6c399420c38bf13d400012e08070d1b615890004c08555c49853408b12231c2acb0f2893a26930ad964cc6e4704f8d5ca2c32303af0637281634f50e01feb444642016aa41eab8bb78ab512f5ec89b2c8db1b01d0c6c380c009273e6983028506687286f4a82d1411059c55316a8ae6d667dda39a0218440c44000b174a933acf6c011d92a140149ac751c0507c0d0f6c5141b670942041b2db534404ab8854c8ab85d4218fbed4c8f9143c954b0c49cbcde74089160e57f0045052e548f27701ec24ef738a20fc94e24b9310926d86df14e414a07482d7507c50ca202fbec0002f9b4ed07248f7828c40a8289c5739984f09411108e8259814cb89bf02b2688',
        difficulty: '0x0',
        number: '0x11a1d48',
        gasLimit: '0x1c9c380',
        gasUsed: '0xdb8485',
        timestamp: '0x65445eff',
        extraData: '0x7273796e632d6275696c6465722e78797a',
        mixHash: '0x51e2514f5ab8d09bca53a15d73996ac7b5389872e4f2b1b7277afeb3f1a9d559',
        nonce: '0x0000000000000000',
        baseFeePerGas: '0x3847759e4',
        withdrawalsRoot: '0x114350f058bd9496a55fc98134dba4fa9aea36083246ae9ad7adcc9906e3eb58',
      },
      {
        hash: '0xf98958f9c83103ec7f0d5f13cf2c36e9793d99413aa06943fad5a8743c055b29',
        parentHash: '0xb37620f0875d897305dad1b7cbd043243880ad96acdb04d73f38b039796c821a',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        miner: '0x1f9090aae28b8a3dceadf281b0f12828e676c326',
        stateRoot: '0x356e3c73d12ea1020b9bc022ec73d08e752e054e355df84cc20023bb5438c2f4',
        transactionsRoot: '0x7db01aa19fcf9438293c5744cf7f81cb47f6fd8934bb38651b9328931988b72a',
        receiptsRoot: '0x61aa2951a6bc6f94ec59c722b8fcf4a9cb4b71d3c5c06aec9848cdb6e8626691',
        logsBloom:
          '0x4dff21b3771d80875898d9f8c10a71bfb05162b5628cb6a09c81a9e7df8ba4c1e0361f25984035894a687b2450b38130de2588ab9921387df52924eb4d7e11c2ba7f75886a10a6acf999794fde671aa4d19856e175641870f9fc2860dfbeac5eef971134e75b41ee16d5d1c594a7ecbff31e494a4fdf8cde5ee11e17297dd621e819ff7c39def9108aee77c0a32a0a7d475d26032ddf2bfe0e94315c76b73e3dfbfac9605dd5a204973e39cd99a70aaf26b6a5f77924b25b8d674ddf64886b21d912b96b81031fc26e53308332df088f6380902aecb794390703630e3456b810513afdcf80516d9884a730e5b220cf3ca47c1de0d8bf34d15bba6508e21505df',
        difficulty: '0x0',
        number: '0x14a2d48',
        gasLimit: '0x1ca35ef',
        gasUsed: '0x1005a4c',
        timestamp: '0x67893e93',
        extraData: '0x407273796e636275696c646572',
        mixHash: '0x680a819d98146baadc2ce3286f05074ef16c8c79ef2789bef8e5ab8a755c2b11',
        nonce: '0x0000000000000000',
        baseFeePerGas: '0x2015b8fcc',
        withdrawalsRoot: '0xda6b506b0b73ff427edac248fd9a50d13574849b0aba8aae4c91c6a4657d17da',
        blobGasUsed: '0xa0000',
        excessBlobGas: '0x4d00000',
        parentBeaconBlockRoot: '0x868fd48788b5a92d01ebb31bab47b997ce3f35e30ea4dd4055751d6309a71ff0',
      },
      {
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
        // Check helper (for old evm versions)
        const check = (promise, value, field) =>
          value
            ? expect(promise).to.eventually.equal(value)
            : expect(promise).to.be.revertedWithCustomError(this.mock, 'FieldNotPresentInBlockHeader').withArgs(field);

        const headerRLP = rlpEncodeBlock(block);

        // encoding sanity check
        expect(ethers.keccak256(headerRLP)).to.equal(block.hash);

        // parsing check
        await check(this.mock.$getParentHash(headerRLP), block.parentHash, HeaderField.ParentHash);
        await check(this.mock.$getOmmersHash(headerRLP), block.sha3Uncles, HeaderField.OmmersHash);
        await check(this.mock.$getCoinbase(headerRLP), ethers.getAddress(block.miner), HeaderField.Coinbase);
        await check(this.mock.$getStateRoot(headerRLP), block.stateRoot, HeaderField.StateRoot);
        await check(this.mock.$getTransactionsRoot(headerRLP), block.transactionsRoot, HeaderField.TransactionsRoot);
        await check(this.mock.$getReceiptsRoot(headerRLP), block.receiptsRoot, HeaderField.ReceiptsRoot);
        await check(this.mock.$getLogsBloom(headerRLP), block.logsBloom, HeaderField.LogsBloom);
        await check(this.mock.$getDifficulty(headerRLP), block.difficulty, HeaderField.Difficulty);
        await check(this.mock.$getNumber(headerRLP), block.number, HeaderField.Number);
        await check(this.mock.$getGasLimit(headerRLP), block.gasLimit, HeaderField.GasLimit);
        await check(this.mock.$getGasUsed(headerRLP), block.gasUsed, HeaderField.GasUsed);
        await check(this.mock.$getTimestamp(headerRLP), block.timestamp, HeaderField.Timestamp);
        await check(this.mock.$getExtraData(headerRLP), block.extraData, HeaderField.ExtraData);
        await check(this.mock.$getPrevRandao(headerRLP), block.mixHash, HeaderField.PrevRandao);
        await check(this.mock.$getNonce(headerRLP), block.nonce, HeaderField.Nonce);
        await check(this.mock.$getBaseFeePerGas(headerRLP), block.baseFeePerGas, HeaderField.BaseFeePerGas);
        await check(this.mock.$getWithdrawalsRoot(headerRLP), block.withdrawalsRoot, HeaderField.WithdrawalsRoot);
        await check(this.mock.$getBlobGasUsed(headerRLP), block.blobGasUsed, HeaderField.BlobGasUsed);
        await check(this.mock.$getExcessBlobGas(headerRLP), block.excessBlobGas, HeaderField.ExcessBlobGas);
        await check(
          this.mock.$getParentBeaconBlockRoot(headerRLP),
          block.parentBeaconBlockRoot,
          HeaderField.ParentBeaconBlockRoot,
        );
        await check(this.mock.$getRequestsHash(headerRLP), block.requestsHash, HeaderField.RequestsHash);
        await check(
          this.mock.$getBlockAccessListHash(headerRLP),
          block.blockAccessListHash,
          HeaderField.BlockAccessListHash,
        );
      });
    }
  });
});
