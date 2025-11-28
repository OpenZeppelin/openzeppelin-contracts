const { ethers } = require('hardhat');
const { expect } = require('chai');
const { spawn } = require('child_process');

const { Enum } = require('../../helpers/enums');

const hardhat = 'hardhat';
const anvil = 'anvil';
const anvilPort = 8546;
const ProofError = Enum(
  'NO_ERROR',
  'EMPTY_KEY',
  'INDEX_OUT_OF_BOUNDS',
  'INVALID_ROOT_HASH',
  'INVALID_LARGE_INTERNAL_HASH',
  'INVALID_INTERNAL_NODE_HASH',
  'EMPTY_VALUE',
  'TOO_LARGE_VALUE',
  'INVALID_EXTRA_PROOF_ELEMENT',
  'MISMATCH_LEAF_PATH_KEY_REMAINDERS',
  'INVALID_PATH_REMAINDER',
  'INVALID_KEY_REMAINDER',
  'UNKNOWN_NODE_PREFIX',
  'UNPARSEABLE_NODE',
  'INVALID_PROOF',
);

// Method eth_getProof is not supported with default Hardhat Network, so Anvil is used for that.
async function fixture(anvilProcess) {
  // Wait for Anvil to be ready
  await new Promise(resolve => {
    anvilProcess.stdout.once('data', resolve);
  });
  if (process.env.ANVIL_LOGS === 'true') {
    anvilProcess.stdout.on('data', function (data) {
      console.log(data.toString()); // optional logging
    });
  }
  const [provider, account, storage] = [{}, {}, {}];
  // Setup and deploy contracts on both Hardhat and Anvil networks.
  for (const providerType of [hardhat, anvil]) {
    provider[providerType] =
      providerType === anvil ? new ethers.JsonRpcProvider(`http://localhost:${anvilPort}`) : ethers.provider;
    account[providerType] = await provider[providerType].getSigner(0);
    storage[providerType] = await ethers.deployContract('StorageSlotMock', account[providerType]);
  }

  const mock = await ethers.deployContract('$TrieProof', account[hardhat]); // only required on hardhat network

  const getProof = async function (contract, slot, tx) {
    const { storageHash, storageProof } = await this.provider[anvil].send('eth_getProof', [
      contract[anvil].target,
      [slot],
      tx ? ethers.toBeHex(tx[anvil].blockNumber) : 'latest',
    ]);
    const { key, value, proof } = storageProof[0];
    return { key, value: ethers.zeroPadBytes(value, 32), proof, storageHash };
  };

  return {
    anvilProcess,
    provider,
    account,
    storage,
    mock,
    getProof,
  };
}

describe('TrieProof', function () {
  beforeEach(async function () {
    this.anvilProcess = await startAnvil(); // assign as soon as possible to allow killing in case fixture fails
    Object.assign(this, await fixture(this.anvilProcess));
  });

  afterEach(async function () {
    if (this.anvilProcess) {
      this.anvilProcess.kill();
    }
  });

  describe('verify proof', function () {
    it('returns true with proof size 1 (even leaf [0x20])', async function () {
      const slot = ethers.ZeroHash;
      await call(this.storage, 'setUint256Slot', [slot, 42]);
      const { key, value, proof, storageHash } = await this.getProof(this.storage, slot);

      await expect(this.mock.$verify(ethers.keccak256(key), value, proof, storageHash)).to.eventually.be.true;
    });

    it('returns true with proof size 2 (branch then odd leaf [0x3])', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await call(this.storage, 'setUint256Slot', [slot0, 42]);
      await call(this.storage, 'setUint256Slot', [slot1, 43]);
      const { key, value, proof, storageHash } = await this.getProof(this.storage, slot1);

      await expect(this.mock.$verify(ethers.keccak256(key), value, proof, storageHash)).to.eventually.be.true;
    });

    it('returns true with proof size 3 (even extension [0x00], branch then leaf)', async function () {
      const slots = [
        '0x0000000000000000000000000000000000000000000000000000000000001889', // 0xabc4243e220df4927f4d7b432d2d718dadbba652f6cee6a45bb90c077fa4e158
        '0x0000000000000000000000000000000000000000000000000000000000008b23', // 0xabd5ef9a39144905d28bd8554745ebae050359cf7e89079f49b66a6c06bd2bf9
        '0x0000000000000000000000000000000000000000000000000000000000002383', // 0xabe87cb73c1e15a89cfb0daa7fd0cc3eb1a762345fe15d668f5061a4900b22fa
      ];
      await call(this.storage, 'setUint256Slot', [slots[0], 42]);
      await call(this.storage, 'setUint256Slot', [slots[1], 43]);
      await call(this.storage, 'setUint256Slot', [slots[2], 44]);
      for (let slot of slots) {
        const { key, value, proof, storageHash } = await this.getProof(this.storage, slot);
        await expect(this.mock.$verify(ethers.keccak256(key), value, proof, storageHash)).to.eventually.be.true;
      }
    });

    it('returns true with proof size 3 (odd extension [0x1], branch then leaf)', async function () {
      const slots = [
        '0x0000000000000000000000000000000000000000000000000000000000004616', // 0xabcd2ce29d227a0aaaa2ea425df9d5c96a569b416fd0bb7e018b8c9ce9b9d15d
        '0x0000000000000000000000000000000000000000000000000000000000012dd3', // 0xabce7718834e2932319fc4642268a27405261f7d3826b19811d044bf2b56ebb1
        '0x000000000000000000000000000000000000000000000000000000000000ce8f', // 0xabcf8b375ce20d03da20a3f5efeb8f3666810beca66f729f995953f51559a4ff
      ];
      await call(this.storage, 'setUint256Slot', [slots[0], 42]);
      await call(this.storage, 'setUint256Slot', [slots[1], 43]);
      await call(this.storage, 'setUint256Slot', [slots[2], 44]);
      for (let slot of slots) {
        const { key, value, proof, storageHash } = await this.getProof(this.storage, slot);
        await expect(this.mock.$verify(ethers.keccak256(key), value, proof, storageHash)).to.eventually.be.true;
      }
    });

    it('returns false for invalid proof', async function () {
      await expect(this.mock.$verify('0x', ethers.ZeroHash, [], ethers.ZeroHash)).to.eventually.be.false;
    });
  });

  describe('process invalid proof', function () {
    it('fails to process proof with empty key', async function () {
      await expect(this.mock.$processProof('0x', [], ethers.ZeroHash)).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.EMPTY_KEY,
      ]);
    });

    it.skip('fails to process proof with key index out of bounds', async function () {}); // TODO: INDEX_OUT_OF_BOUNDS

    it('fails to process proof with invalid root hash', async function () {
      const slot = ethers.ZeroHash;
      const tx = await call(this.storage, 'setUint256Slot', [slot, 42]);
      const { key, proof, storageHash } = await this.getProof(this.storage, slot, tx);

      // Corrupt root hash
      await expect(this.mock.$processProof(key, proof, ethers.keccak256(storageHash))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_ROOT_HASH,
      ]);
    });

    it('fails to process proof with invalid internal large hash', async function () {
      const slot0 = ethers.ZeroHash;
      const slot1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      await call(this.storage, 'setUint256Slot', [slot0, 42]);
      await call(this.storage, 'setUint256Slot', [slot1, 43]);

      const { key, proof, storageHash } = await this.getProof(this.storage, slot1);
      proof[1] = ethers.toBeHex(BigInt(proof[1]) + 1n); // Corrupt internal large node hash

      await expect(this.mock.$processProof(key, proof, storageHash)).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_LARGE_INTERNAL_HASH,
      ]);
    });

    it('fails to process proof with invalid internal short node', async function () {
      const proof = [
        ethers.encodeRlp(['0x0000', '0x2bad']), // corrupt internal short node
        ethers.encodeRlp(['0x2000', '0x']),
      ];

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_INTERNAL_NODE_HASH,
      ]);
    });

    it('fails to process proof with empty value', async function () {
      const proof = [ethers.encodeRlp(['0x2000', '0x'])];

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.EMPTY_VALUE,
      ]);
    });

    it('fails to process proof with too large value', async function () {
      const proof = [
        ethers.encodeRlp([
          '0x2000',
          ethers.id('valid value') + '2bad', // value length > 32 bytes
        ]),
      ];

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.TOO_LARGE_VALUE,
      ]);
    });

    it('fails to process proof with invalid extra proof', async function () {
      const proof = [ethers.encodeRlp(['0x2000', '0x'])];
      proof[1] = ethers.encodeRlp([]); // extra proof element

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_EXTRA_PROOF_ELEMENT,
      ]);
    });

    it('fails to process proof with mismatched leaf path and key remainders', async function () {
      const slot = ethers.ZeroHash;
      const key = ethers.keccak256(slot);
      const value = '0x2a';
      const proof = [
        ethers.encodeRlp([
          '0x20' + ethers.toBeHex(BigInt(key) + 1n).replace('0x', ''), // corrupt end of leaf path
          value,
        ]),
      ];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDERS,
      ]);
    });

    it('fails to process proof with invalid path remainder', async function () {
      const proof = [ethers.encodeRlp(['0x0011', '0x'])];

      await expect(
        this.mock.$processProof(ethers.ZeroHash, proof, ethers.keccak256(proof[0])),
      ).to.eventually.deep.equal([ethers.ZeroHash, ProofError.INVALID_PATH_REMAINDER]);
    });

    it.skip('fails to process proof with invalid key remainder', async function () {}); // TODO: INVALID_KEY_REMAINDER

    it('fails to process proof with unknown node prefix', async function () {
      const proof = [ethers.encodeRlp(['0x40', '0x'])];

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.UNKNOWN_NODE_PREFIX,
      ]);
    });

    it('fails to process proof with unparsable node', async function () {
      const proof = [ethers.encodeRlp(['0x00', '0x00', '0x00'])];

      await expect(this.mock.$processProof('0x00', proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.UNPARSEABLE_NODE,
      ]);
    });

    it('fails to process proof with invalid proof', async function () {
      await expect(this.mock.$processProof('0x00', [], ethers.ZeroHash)).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_PROOF,
      ]);
    });
  });

  describe('Optimism contract-bedrock unit tests', function () {
    for (const { title, root, key, value, proof, error } of [
      {
        title: 'validProof1',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x6b6579326262',
        value: '0x6176616c32',
        proof: [
          '0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386',
          '0xf84580a0582eed8dd051b823d13f8648cdcd08aa2d8dac239f458863c4620e8c4d605debca83206262856176616c32ca83206363856176616c3380808080808080808080808080',
          '0xca83206262856176616c32',
        ],
        error: ProofError.NO_ERROR,
      },
    ]) {
      it(title, async function () {
        await expect(this.mock.$processProof(key, proof, root)).to.eventually.deep.equal([
          ethers.zeroPadBytes(value, 32),
          error,
        ]);
      });
    }
  });
});

/**
 * Start an Anvil process.
 * @returns Anvil process
 */
async function startAnvil() {
  return spawn('anvil', ['--port', anvilPort], {
    timeout: 30000,
  });
}

/**
 * Call a method on both Hardhat and Anvil networks.
 * @returns txs on both networks
 */
async function call(contract, method, args) {
  const hardhatTx = await contract[hardhat][method](...args);
  const anvilTx = await contract[anvil][method](...args);
  return {
    [hardhat]: hardhatTx,
    [anvil]: anvilTx,
  };
}
