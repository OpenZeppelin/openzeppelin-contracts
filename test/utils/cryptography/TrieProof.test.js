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
      const key = '0x00';
      const proof = [
        ethers.encodeRlp(['0x0000', '0x2bad']), // corrupt internal short node
        ethers.encodeRlp(['0x2000', '0x']),
      ];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_INTERNAL_NODE_HASH,
      ]);
    });

    it('fails to process proof with empty value', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x2000', '0x'])];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.EMPTY_VALUE,
      ]);
    });

    it('fails to process proof with too large value', async function () {
      const key = '0x00';
      const proof = [
        ethers.encodeRlp([
          '0x2000',
          ethers.id('valid value') + '2bad', // value length > 32 bytes
        ]),
      ];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.TOO_LARGE_VALUE,
      ]);
    });

    it('fails to process proof with invalid extra proof', async function () {
      const key = '0x00';
      const proof = [
        ethers.encodeRlp(['0x2000', '0x']),
        ethers.encodeRlp([]), // extra proof element
      ];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.INVALID_EXTRA_PROOF_ELEMENT,
      ]);
    });

    describe('fails to process proof with mismatched leaf path and key remainders', function () {
      it('path is not a prefix of key', async function () {
        const key = '0xabcd';
        const proof = [
          ethers.encodeRlp([
            '0x02abce', // Prefix.LEAF_EVEN + '0xabce' (not a prefix of 'abcd')
            '0x2a', // value
          ]),
        ];

        await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
          ethers.ZeroHash,
          ProofError.INVALID_PATH_REMAINDER,
        ]);
      });

      it('path is longer than key', async function () {
        const key = '0xabcd';
        const proof = [
          ethers.encodeRlp([
            '0x030abcde', // Prefix.LEAF_ODD + '0xabcde' (not a prefix of 'abcd')
            '0x2a', // value
          ]),
        ];

        await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
          ethers.ZeroHash,
          ProofError.INVALID_PATH_REMAINDER,
        ]);
      });

      it('key not fully consumed', async function () {
        const key = '0xabcd';
        const proof = [
          ethers.encodeRlp([
            '0x3abc', // Prefix.LEAF_ODD + '0xabc' (a prefix of 'abcd' that doesn't consume the d)
            '0x2a', // value
          ]),
        ];

        await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
          ethers.ZeroHash,
          ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDERS,
        ]);
      });
    });

    it('fails to process proof with unknown node prefix', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x40', '0x'])];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
        ethers.ZeroHash,
        ProofError.UNKNOWN_NODE_PREFIX,
      ]);
    });

    it('fails to process proof with unparsable node', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x00', '0x00', '0x00'])];

      await expect(this.mock.$processProof(key, proof, ethers.keccak256(proof[0]))).to.eventually.deep.equal([
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

  // Unit tests from https://github.com/ethereum-optimism/optimism/blob/ef970556e668b271a152124023a8d6bb5159bacf/packages/contracts-bedrock/test/libraries/trie/MerkleTrie.t.sol
  describe('Optimism contract-bedrock unit tests', function () {
    for (const { title, root, key, value, proof, error } of [
      {
        title: 'test_get_validProof1_succeeds',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x6b6579326262',
        value: '0x6176616c32',
        proof: [
          '0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386',
          '0xf84580a0582eed8dd051b823d13f8648cdcd08aa2d8dac239f458863c4620e8c4d605debca83206262856176616c32ca83206363856176616c3380808080808080808080808080',
          '0xca83206262856176616c32',
        ],
      },
      {
        title: 'test_get_validProof1_succeeds - modified with invalid short node',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x6b6579326262',
        proof: [
          '0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386',
          '0xf84580a0582eed8dd051b823d13f8648cdcd08aa2d8dac239f458863c4620e8c4d605debca83206262856176616c32ca83206363856176616c3380808080808080808080808080',
          '0xca83206262856176616c33',
        ],
        error: ProofError.INVALID_INTERNAL_NODE_HASH,
      },
      // test_get_validProof2_succeeds - TOO_LARGE_VALUE
      // test_get_validProof3_succeeds - TOO_LARGE_VALUE
      {
        title: 'test_get_validProof4_succeeds',
        root: '0x37956bab6bba472308146808d5311ac19cb4a7daae5df7efcc0f32badc97f55e',
        key: '0x6b6579316161',
        value: '0x3031323334',
        proof: ['0xce87206b6579316161853031323334'],
      },
      // test_get_validProof5_succeeds - TOO_LARGE_VALUE
      {
        title: 'test_get_validProof6_succeeds',
        root: '0xcb65032e2f76c48b82b5c24b3db8f670ce73982869d38cd39a624f23d62a9e89',
        key: '0x6b657932',
        value: '0x73686f7274',
        proof: [
          '0xe68416b65793a0f3f387240403976788281c0a6ee5b3fc08360d276039d635bb824ea7e6fed779',
          '0xf87180a034d14ccc7685aa2beb64f78b11ee2a335eae82047ef97c79b7dda7f0732b9f4ca05fb052b64e23d177131d9f32e9c5b942209eb7229e9a07c99a5d93245f53af18a09a137197a43a880648d5887cce656a5e6bbbe5e44ecb4f264395ccaddbe1acca80808080808080808080808080',
          '0xdf808080808080c9823262856176616c338080808080808080808573686f7274',
        ],
      },
      {
        title: 'test_get_validProof7_succeeds',
        root: '0xcb65032e2f76c48b82b5c24b3db8f670ce73982869d38cd39a624f23d62a9e89',
        key: '0x6b657933',
        value: '0x31323334353637383930313233343536373839303132333435363738393031',
        proof: [
          '0xe68416b65793a0f3f387240403976788281c0a6ee5b3fc08360d276039d635bb824ea7e6fed779',
          '0xf87180a034d14ccc7685aa2beb64f78b11ee2a335eae82047ef97c79b7dda7f0732b9f4ca05fb052b64e23d177131d9f32e9c5b942209eb7229e9a07c99a5d93245f53af18a09a137197a43a880648d5887cce656a5e6bbbe5e44ecb4f264395ccaddbe1acca80808080808080808080808080',
          '0xf839808080808080c9823363856176616c338080808080808080809f31323334353637383930313233343536373839303132333435363738393031',
        ],
      },
      {
        title: 'test_get_validProof8_succeeds',
        root: '0x72e6c01ad0c9a7b517d4bc68a5b323287fe80f0e68f5415b4b95ecbc8ad83978',
        key: '0x61',
        value: '0x61',
        proof: [
          '0xd916d780c22061c22062c2206380808080808080808080808080',
          '0xd780c22061c22062c2206380808080808080808080808080',
          '0xc22061',
        ],
      },
      {
        title: 'test_get_validProof9_succeeds',
        root: '0x72e6c01ad0c9a7b517d4bc68a5b323287fe80f0e68f5415b4b95ecbc8ad83978',
        key: '0x62',
        value: '0x62',
        proof: [
          '0xd916d780c22061c22062c2206380808080808080808080808080',
          '0xd780c22061c22062c2206380808080808080808080808080',
          '0xc22062',
        ],
      },
      {
        title: 'test_get_validProof10_succeeds',
        root: '0x72e6c01ad0c9a7b517d4bc68a5b323287fe80f0e68f5415b4b95ecbc8ad83978',
        key: '0x63',
        value: '0x63',
        proof: [
          '0xd916d780c22061c22062c2206380808080808080808080808080',
          '0xd780c22061c22062c2206380808080808080808080808080',
          '0xc22063',
        ],
      },
      {
        title: 'test_get_nonexistentKey1_reverts',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x6b657932',
        proof: [
          '0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386',
          '0xf84580a0582eed8dd051b823d13f8648cdcd08aa2d8dac239f458863c4620e8c4d605debca83206262856176616c32ca83206363856176616c3380808080808080808080808080',
          '0xca83206262856176616c32',
        ],
        error: ProofError.INVALID_PATH_REMAINDER,
      },
      {
        title: 'test_get_nonexistentKey2_reverts',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x616e7972616e646f6d6b6579',
        proof: ['0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386'],
        error: ProofError.INVALID_PATH_REMAINDER,
      },
      {
        title: 'test_get_wrongKeyProof_reverts',
        root: '0x2858eebfa9d96c8a9e6a0cae9d86ec9189127110f132d63f07d3544c2a75a696',
        key: '0x6b6579316161',
        proof: [
          '0xe216a04892c039d654f1be9af20e88ae53e9ab5fa5520190e0fb2f805823e45ebad22f',
          '0xf84780d687206e6f746865728d33343938683472697568677765808080808080808080a0854405b57aa6dc458bc41899a761cbbb1f66a4998af6dd0e8601c1b845395ae38080808080',
          '0xd687206e6f746865728d33343938683472697568677765',
        ],
        error: ProofError.INVALID_INTERNAL_NODE_HASH,
      },
      // test_get_corruptedProof_reverts - RLP Encoding
      // test_get_invalidDataRemainder_reverts - RLP Encoding
      // test_get_invalidInternalNodeHash_reverts - Error with ignored trailing zeros
      {
        title: 'test_get_zeroBranchValueLength_reverts',
        root: '0xe04b3589eef96b237cd49ccb5dcf6e654a47682bfa0961d563ab843f7ad1e035',
        key: '0xaa',
        proof: [
          '0xdd8200aad98080808080808080808080c43b82aabbc43c82aacc80808080',
          '0xd98080808080808080808080c43b82aabbc43c82aacc80808080',
        ],
        error: ProofError.EMPTY_VALUE,
      },
      {
        title: 'test_get_zeroLengthKey_reverts',
        root: '0x54157fd62cdf2f474e7bfec2d3cd581e807bee38488c9590cb887add98936b73',
        key: '0x',
        proof: ['0xc78320f00082b443'],
        error: ProofError.EMPTY_KEY,
      },
      {
        title: 'test_get_smallerPathThanKey1_reverts',
        root: '0xa513ba530659356fb7588a2c831944e80fd8aedaa5a4dc36f918152be2be0605',
        key: '0x01',
        proof: [
          '0xdb10d9c32081bbc582202381aa808080808080808080808080808080',
          '0xd9c32081bbc582202381aa808080808080808080808080808080',
          '0xc582202381aa',
        ],
        error: ProofError.INVALID_PATH_REMAINDER,
      },
      {
        title: 'test_get_smallerPathThanKey2_reverts',
        root: '0xa06abffaec4ebe8ccde595f4547b864b4421b21c1fc699973f94710c9bc17979',
        key: '0xaa',
        proof: [
          '0xe21aa07ea462226a3dc0a46afb4ded39306d7a84d311ada3557dfc75a909fd25530905',
          '0xf380808080808080808080a027f11bd3af96d137b9287632f44dd00fea1ca1bd70386c30985ede8cc287476e808080c220338080',
          '0xe48200bba0a6911545ed01c2d3f4e15b8b27c7bfba97738bd5e6dd674dd07033428a4c53af',
        ],
        error: ProofError.INVALID_PATH_REMAINDER,
      },
      {
        title: 'test_get_smallerPathThanKey2_reverts',
        root: '0x278c88eb59beba4f8b94f940c41614bb0dd80c305859ebffcd6ce07c93ca3749',
        key: '0xaa',
        proof: [
          '0xd91ad780808080808080808080c32081aac32081ab8080808080',
          '0xd780808080808080808080c32081aac32081ab8080808080',
          '0xc32081aa',
          '0xc32081aa',
        ],
        error: ProofError.INVALID_EXTRA_PROOF_ELEMENT,
      },
    ]) {
      it(title, async function () {
        await expect(this.mock.$processProof(key, proof, root)).to.eventually.deep.equal([
          ethers.zeroPadBytes(value ?? ethers.ZeroHash, 32),
          error ?? ProofError.NO_ERROR,
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
