const { ethers } = require('hardhat');
const { expect } = require('chai');
const { spawn } = require('child_process');

const { Enum } = require('../../helpers/enums');
const { zip } = require('../../helpers/iterate');
const { generators } = require('../../helpers/random');
const { BlockTries } = require('../../helpers/trie');
const { batchInBlock } = require('../../helpers/txpool');

const ProofError = Enum(
  'NO_ERROR', // No error occurred during proof traversal
  'EMPTY_KEY', // The provided key is empty
  'INVALID_ROOT', // The validation of the root node failed
  'INVALID_LARGE_NODE', // The validation of a large node failed
  'INVALID_SHORT_NODE', // The validation of a short node failed
  'EMPTY_PATH', // The path in a leaf or extension node is empty
  'INVALID_PATH_REMAINDER', // The path remainder in a leaf or extension node is invalid
  'EMPTY_EXTENSION_PATH_REMAINDER', // The path remainder in an extension node is empty
  'INVALID_EXTRA_PROOF_ELEMENT', // A leaf value should be the last proof element
  'EMPTY_VALUE', // The leaf value is empty
  'MISMATCH_LEAF_PATH_KEY_REMAINDER', // The path remainder in a leaf node doesn't match the key remainder
  'UNKNOWN_NODE_PREFIX', // The node prefix is unknown
  'UNPARSEABLE_NODE', // The node cannot be parsed from RLP encoding
  'INVALID_PROOF', // General failure during proof traversal
);

const ZeroBytes = generators.bytes.zero;

const sanitizeHexString = value => (value.length % 2 ? '0x0' : '0x') + value.replace(/0x/, '');
const encodeStorageLeaf = value => ethers.encodeRlp(ethers.stripZerosLeft(value));

describe('TrieProof', function () {
  before('start anvil node', async function () {
    const port = 8546;

    // start process and create provider
    this.process = await spawn('anvil', ['--port', port], { timeout: 30000 });
    await new Promise(resolve => this.process.stdout.once('data', resolve));
    this.provider = new ethers.JsonRpcProvider(`http://localhost:${port}`);

    // deploy mock on the hardhat network
    this.mock = await ethers.deployContract('$TrieProof');
  });

  beforeEach('use fresh storage contract with empty state for each test', async function () {
    this.storage = await this.provider.getSigner(0).then(signer => ethers.deployContract('StorageSlotMock', signer));
    this.target = await this.provider.getSigner(0).then(signer => ethers.deployContract('CallReceiverMock', signer));

    this.getProof = ({
      provider = this.provider,
      address = this.storage.target,
      storageKeys = [],
      blockNumber = 'latest',
    }) =>
      provider.send('eth_getProof', [
        address,
        ethers.isHexString(storageKeys) ? [storageKeys] : storageKeys,
        blockNumber,
      ]);
  });

  after('stop anvil node', async function () {
    this.process.kill();
  });

  describe('verify', function () {
    it('verify transaction and receipt inclusion in block', async function () {
      // Multiple transactions/events in a block
      const txs = await batchInBlock(
        [
          () => this.target.mockFunction({ gasLimit: 100000 }),
          () => this.target.mockFunctionWithArgs(0, 1, { gasLimit: 100000 }),
          () => this.target.mockFunctionWithArgs(17, 42, { gasLimit: 100000 }),
        ],
        this.provider,
      );

      // for some reason ethers doesn't expose the transactionsRoot in blocks, so we fetch the block details via RPC instead.
      const { transactionsRoot, receiptsRoot } = await this.provider.send('eth_getBlockByNumber', [
        txs.at(0).blockNumber,
        false,
      ]);

      const blockTries = await this.provider
        .getBlock(txs.at(0).blockNumber)
        .then(block => BlockTries.from(block).ready());

      // Sanity check trie roots
      expect(blockTries.transactionTrieRoot).to.equal(transactionsRoot);
      expect(blockTries.receiptTrieRoot).to.equal(receiptsRoot);

      for (const tx of txs) {
        // verify transaction inclusion in the block's transaction trie
        const transaction = await tx.getTransaction().then(BlockTries.serializeTransaction);
        const transactionProof = await blockTries.getTransactionProof(tx.index);
        await expect(
          this.mock.$verify(transaction, transactionsRoot, BlockTries.indexToKey(tx.index), transactionProof),
        ).to.eventually.be.true;

        // verify receipt inclusion in the block's receipt trie
        const receipt = BlockTries.serializeReceipt(tx);
        const receiptProof = await blockTries.getReceiptProof(tx.index);
        await expect(this.mock.$verify(receipt, receiptsRoot, BlockTries.indexToKey(tx.index), receiptProof)).to
          .eventually.be.true;
      }
    });

    describe('processes valid account and storage proofs', function () {
      for (const { title, slots } of [
        {
          title: 'returns true with proof size 1 (even leaf [0x20])',
          slots: {
            '0x0000000000000000000000000000000000000000000000000000000000000000': generators.bytes32(), // 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563
          },
        },
        {
          title: 'returns true with proof size 2 (branch then odd leaf [0x3])',
          slots: {
            '0x0000000000000000000000000000000000000000000000000000000000000000': generators.bytes32(), // 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563
            '0x0000000000000000000000000000000000000000000000000000000000000001': generators.bytes32(), // 0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6
          },
        },
        {
          title: 'returns true with proof size 3 (even extension [0x00], branch then leaf)',
          slots: {
            '0x0000000000000000000000000000000000000000000000000000000000001889': generators.bytes32(), // 0xabc4243e220df4927f4d7b432d2d718dadbba652f6cee6a45bb90c077fa4e158
            '0x0000000000000000000000000000000000000000000000000000000000008b23': generators.bytes32(), // 0xabd5ef9a39144905d28bd8554745ebae050359cf7e89079f49b66a6c06bd2bf9
            '0x0000000000000000000000000000000000000000000000000000000000002383': generators.bytes32(), // 0xabe87cb73c1e15a89cfb0daa7fd0cc3eb1a762345fe15d668f5061a4900b22fa
          },
        },
        {
          title: 'returns true with proof size 3 (odd extension [0x1], branch then leaf)',
          slots: {
            '0x0000000000000000000000000000000000000000000000000000000000004616': generators.bytes32(), // 0xabcd2ce29d227a0aaaa2ea425df9d5c96a569b416fd0bb7e018b8c9ce9b9d15d
            '0x0000000000000000000000000000000000000000000000000000000000012dd3': generators.bytes32(), // 0xabce7718834e2932319fc4642268a27405261f7d3826b19811d044bf2b56ebb1
            '0x000000000000000000000000000000000000000000000000000000000000ce8f': generators.bytes32(), // 0xabcf8b375ce20d03da20a3f5efeb8f3666810beca66f729f995953f51559a4ff
          },
        },
      ]) {
        it(title, async function () {
          // set storage state
          const txs = await Promise.all(
            Object.entries(slots).map(([slot, value]) => this.storage.setBytes32Slot(slot, value)),
          );

          // get block that contains the latest storage changes
          const { stateRoot, number: blockNumber } = await txs.at(-1).getBlock();

          // build storage proofs for all storage slots (in that block)
          const { accountProof, storageHash, storageProof, codeHash } = await this.getProof({
            storageKeys: Object.keys(slots),
            blockNumber: ethers.toBeHex(blockNumber),
          });

          // Verify account details in the block's state trie
          await expect(
            this.mock.$verify(
              ethers.encodeRlp([
                '0x01', // nonce
                '0x', // balance
                storageHash,
                codeHash,
              ]),
              stateRoot,
              ethers.keccak256(this.storage.target),
              accountProof,
            ),
          ).to.eventually.be.true;

          // Verify storage proof in the account's storage trie
          for (const [[slot, value], { proof, value: proofValue, key }] of zip(Object.entries(slots), storageProof)) {
            // proof sanity check
            expect(sanitizeHexString(proofValue)).to.equal(ethers.stripZerosLeft(value), proofValue);
            expect(sanitizeHexString(key)).to.equal(slot, key);

            // verify storage slot
            await expect(this.mock.$verify(encodeStorageLeaf(value), storageHash, ethers.keccak256(slot), proof)).to
              .eventually.be.true;
          }
        });
      }
    });

    it('returns false for invalid proof', async function () {
      await expect(this.mock.$verify(ZeroBytes, ethers.ZeroHash, '0x', [])).to.eventually.be.false;
    });
  });

  describe('process invalid proofs', function () {
    it('fails to process proof with empty key', async function () {
      await expect(this.mock.$traverse(ethers.ZeroHash, '0x', []))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.EMPTY_KEY);

      await expect(this.mock.$tryTraverse(ethers.ZeroHash, '0x', [])).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.EMPTY_KEY,
      ]);
    });

    it('fails to process proof with invalid root hash', async function () {
      const slot = generators.bytes32();
      const value = generators.bytes32();
      await this.storage.setBytes32Slot(slot, value);
      const {
        storageHash,
        storageProof: [{ proof }],
      } = await this.getProof({ storageKeys: [slot] });

      // Correct root hash
      await expect(this.mock.$verify(encodeStorageLeaf(value), storageHash, ethers.keccak256(slot), proof)).to
        .eventually.be.true;
      await expect(this.mock.$traverse(storageHash, ethers.keccak256(slot), proof)).to.eventually.equal(
        encodeStorageLeaf(value),
      );
      await expect(this.mock.$tryTraverse(storageHash, ethers.keccak256(slot), proof)).to.eventually.deep.equal([
        encodeStorageLeaf(value),
        ProofError.NO_ERROR,
      ]);

      // Corrupt root hash
      const invalidHash = generators.bytes(32);

      await expect(this.mock.$verify(encodeStorageLeaf(value), invalidHash, ethers.keccak256(slot), proof)).to
        .eventually.be.false;
      await expect(this.mock.$traverse(invalidHash, ethers.keccak256(slot), proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.INVALID_ROOT);
      await expect(this.mock.$tryTraverse(invalidHash, ethers.keccak256(slot), proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.INVALID_ROOT,
      ]);
    });

    it('fails to process proof with invalid internal large hash', async function () {
      // insert multiple values
      const slot = generators.bytes32();
      const value = generators.bytes32();
      await this.storage.setBytes32Slot(slot, value);
      await this.storage.setBytes32Slot(generators.bytes32(), generators.bytes32());

      const {
        storageHash,
        storageProof: [{ proof }],
      } = await this.getProof({ storageKeys: [slot] });

      // Correct proof
      await expect(this.mock.$verify(encodeStorageLeaf(value), storageHash, ethers.keccak256(slot), proof)).to
        .eventually.be.true;
      await expect(this.mock.$traverse(storageHash, ethers.keccak256(slot), proof)).to.eventually.equal(
        encodeStorageLeaf(value),
      );
      await expect(this.mock.$tryTraverse(storageHash, ethers.keccak256(slot), proof)).to.eventually.deep.equal([
        encodeStorageLeaf(value),
        ProofError.NO_ERROR,
      ]);

      // Corrupt proof - replace the value part with a random hash
      const [p] = ethers.decodeRlp(proof[1]);
      proof[1] = ethers.encodeRlp([p, ethers.encodeRlp(generators.bytes32())]);

      await expect(this.mock.$verify(encodeStorageLeaf(value), storageHash, ethers.keccak256(slot), proof)).to
        .eventually.be.false;
      await expect(this.mock.$traverse(storageHash, ethers.keccak256(slot), proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.INVALID_LARGE_NODE);
      await expect(this.mock.$tryTraverse(storageHash, ethers.keccak256(slot), proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.INVALID_LARGE_NODE,
      ]);
    });

    it('fails to process proof with invalid internal short node', async function () {
      const key = '0x00';
      const proof = [
        ethers.encodeRlp(['0x0000', '0x2bad']), // corrupt internal short node
        ethers.encodeRlp(['0x2000', '0x']),
      ];

      await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.INVALID_SHORT_NODE);
      await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.INVALID_SHORT_NODE,
      ]);
    });

    it('fails to process proof with empty value', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x2000', '0x'])];

      await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.EMPTY_VALUE);
      await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.EMPTY_VALUE,
      ]);
    });

    it('fails to process proof with invalid extra proof', async function () {
      const key = '0x00';
      const proof = [
        ethers.encodeRlp(['0x2000', '0x']),
        ethers.encodeRlp([]), // extra proof element
      ];

      await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.INVALID_EXTRA_PROOF_ELEMENT);
      await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
        ZeroBytes,
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

        await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
          .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
          .withArgs(ProofError.INVALID_PATH_REMAINDER);
        await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
          ZeroBytes,
          ProofError.INVALID_PATH_REMAINDER,
        ]);
      });

      it('fails to process proof with empty path', async function () {
        const proof = [
          ethers.encodeRlp(['0x', []]), // empty path
        ];

        await expect(this.mock.$traverse(ethers.keccak256(proof[0]), '0x00', proof))
          .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
          .withArgs(ProofError.EMPTY_PATH);
        await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), '0x00', proof)).to.eventually.deep.equal([
          ZeroBytes,
          ProofError.EMPTY_PATH,
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

        await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
          .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
          .withArgs(ProofError.INVALID_PATH_REMAINDER);
        await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
          ZeroBytes,
          ProofError.INVALID_PATH_REMAINDER,
        ]);
      });

      it('fails to process proof with empty extension path remainder', async function () {
        const key = '0x00';
        const node2 = ['0x00', '0x'];
        const node1 = [node2].concat(Array(16).fill('0x'));
        const node0 = [node1].concat(Array(16).fill('0x'));
        const proof = [ethers.encodeRlp(node0), ethers.encodeRlp(node1), ethers.encodeRlp(node2)];

        await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
          .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
          .withArgs(ProofError.EMPTY_EXTENSION_PATH_REMAINDER);
        await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
          ZeroBytes,
          ProofError.EMPTY_EXTENSION_PATH_REMAINDER,
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

        await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
          .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
          .withArgs(ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDER);
        await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
          ZeroBytes,
          ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDER,
        ]);
      });
    });

    it('fails to process proof with unknown node prefix', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x40', '0x'])];

      await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.UNKNOWN_NODE_PREFIX);
      await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.UNKNOWN_NODE_PREFIX,
      ]);
    });

    it('fails to process proof with unparsable node', async function () {
      const key = '0x00';
      const proof = [ethers.encodeRlp(['0x00', '0x00', '0x00'])];

      await expect(this.mock.$traverse(ethers.keccak256(proof[0]), key, proof))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.UNPARSEABLE_NODE);
      await expect(this.mock.$tryTraverse(ethers.keccak256(proof[0]), key, proof)).to.eventually.deep.equal([
        ZeroBytes,
        ProofError.UNPARSEABLE_NODE,
      ]);
    });

    it('fails to process proof with invalid proof', async function () {
      await expect(this.mock.$traverse(ethers.ZeroHash, '0x00', []))
        .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
        .withArgs(ProofError.INVALID_PROOF);
      await expect(this.mock.$tryTraverse(ethers.ZeroHash, '0x00', [])).to.eventually.deep.equal([
        ZeroBytes,
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
        title: 'test_get_validProof2_succeeds',
        root: '0xd582f99275e227a1cf4284899e5ff06ee56da8859be71b553397c69151bc942f',
        key: '0x6b6579316161',
        value: '0x303132333435363738393031323334353637383930313233343536373839303132333435363738397878',
        proof: [
          '0xe68416b65793a03101b4447781f1e6c51ce76c709274fc80bd064f3a58ff981b6015348a826386',
          '0xf84580a0582eed8dd051b823d13f8648cdcd08aa2d8dac239f458863c4620e8c4d605debca83206262856176616c32ca83206363856176616c3380808080808080808080808080',
          '0xef83206161aa303132333435363738393031323334353637383930313233343536373839303132333435363738397878',
        ],
      },
      {
        title: 'test_get_validProof3_succeeds',
        root: '0xf838216fa749aefa91e0b672a9c06d3e6e983f913d7107b5dab4af60b5f5abed',
        key: '0x6b6579316161',
        value: '0x303132333435363738393031323334353637383930313233343536373839303132333435363738397878',
        proof: [
          '0xf387206b6579316161aa303132333435363738393031323334353637383930313233343536373839303132333435363738397878',
        ],
      },
      {
        title: 'test_get_validProof4_succeeds',
        root: '0x37956bab6bba472308146808d5311ac19cb4a7daae5df7efcc0f32badc97f55e',
        key: '0x6b6579316161',
        value: '0x3031323334',
        proof: ['0xce87206b6579316161853031323334'],
      },
      {
        title: 'test_get_validProof5_succeeds',
        root: '0xcb65032e2f76c48b82b5c24b3db8f670ce73982869d38cd39a624f23d62a9e89',
        key: '0x6b657931',
        value: '0x30313233343536373839303132333435363738393031323334353637383930313233343536373839566572795f4c6f6e67',
        proof: [
          '0xe68416b65793a0f3f387240403976788281c0a6ee5b3fc08360d276039d635bb824ea7e6fed779',
          '0xf87180a034d14ccc7685aa2beb64f78b11ee2a335eae82047ef97c79b7dda7f0732b9f4ca05fb052b64e23d177131d9f32e9c5b942209eb7229e9a07c99a5d93245f53af18a09a137197a43a880648d5887cce656a5e6bbbe5e44ecb4f264395ccaddbe1acca80808080808080808080808080',
          '0xf862808080808080a057895fdbd71e2c67c2f9274a56811ff5cf458720a7fa713a135e3890f8cafcf8808080808080808080b130313233343536373839303132333435363738393031323334353637383930313233343536373839566572795f4c6f6e67',
        ],
      },
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
        error: ProofError.INVALID_SHORT_NODE,
      },
      // test_get_corruptedProof_reverts - RLP Encoding
      // test_get_invalidDataRemainder_reverts - RLP Encoding
      {
        title: 'test_get_invalidInternalNodeHash_reverts',
        root: '0xa827dff1a657bb9bb9a1c3abe9db173e2f1359f15eb06f1647ea21ac7c95d8fa',
        key: '0xaa',
        proof: [
          '0xe21aa09862c6b113008c4204c13755693cbb868acc25ebaa98db11df8c89a0c0dd3157',
          '0xf380808080808080808080a0de2a9c6a46b6ea71ab9e881c8420570cf19e833c85df6026b04f085016e78f00c220118080808080',
          '0xde2a9c6a46b6ea71ab9e881c8420570cf19e833c85df6026b04f085016e78f',
        ],
        error: ProofError.INVALID_SHORT_NODE,
      },
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
        title: 'test_get_extraProofElements_reverts',
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
        if (error === undefined) {
          await expect(this.mock.$traverse(root, key, proof)).to.eventually.equal(value);
        } else {
          await expect(this.mock.$traverse(root, key, proof))
            .to.revertedWithCustomError(this.mock, 'TrieProofTraversalError')
            .withArgs(error);
        }

        await expect(this.mock.$tryTraverse(root, key, proof)).to.eventually.deep.equal([
          value ?? ZeroBytes,
          error ?? ProofError.NO_ERROR,
        ]);
      });
    }
  });
});
