const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const { generators } = require('../../helpers/random');
const { range } = require('../../helpers/iterate');

const DEPTH = 4; // 16 slots

const makeTree = (leaves = [], length = 2 ** DEPTH, zero = ethers.ZeroHash) =>
  StandardMerkleTree.of(
    []
      .concat(
        leaves,
        Array.from({ length: length - leaves.length }, () => zero),
      )
      .map(leaf => [leaf]),
    ['bytes32'],
    { sortLeaves: false },
  );

const ZERO = makeTree().leafHash([ethers.ZeroHash]);

async function fixture() {
  const mock = await ethers.deployContract('MerkleTreeMock');
  await mock.setup(DEPTH, ZERO);
  return { mock };
}

// Non-commutative hash: keccak256(abi.encode(a, b)) — same as Hashes.efficientKeccak256
// Does NOT sort a and b, so H(a,b) != H(b,a).
const efficientKeccak256 = (a, b) =>
  ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [a, b]));

/**
 * Manually compute the Merkle root for an append-only push-tree with depth `depth`
 * using the same algorithm as MerkleTree.sol's push():
 *   - empty slots are zero
 *   - parent = fnHash(left, right)  (order-sensitive when non-commutative)
 *
 * This mirrors exactly what the Solidity contract does internally.
 */
function computePushTreeRoot(insertedLeaves, depth, zero, fnHash) {
  const size = 2 ** depth;
  // Build full leaf array: inserted leaves + zero padding
  const leaves = [...insertedLeaves, ...Array(size - insertedLeaves.length).fill(zero)];

  // Iteratively hash levels bottom-up
  let level = leaves;
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(fnHash(level[i], level[i + 1]));
    }
    level = next;
  }
  return level[0];
}

// The "zero" leaf value for the non-commutative tree (raw bytes32(0))
const NC_ZERO = ethers.ZeroHash;

// Compute the initial (empty) root for a non-commutative tree
const NC_INITIAL_ROOT = computePushTreeRoot([], DEPTH, NC_ZERO, efficientKeccak256);

async function nonCommutativeFixture() {
  const mock = await ethers.deployContract('MerkleTreeMock');
  await mock.setupNonCommutative(DEPTH, NC_ZERO);
  return { mock };
}

describe('MerkleTree', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('sets initial values at setup', async function () {
    const merkleTree = makeTree();

    await expect(this.mock.root()).to.eventually.equal(merkleTree.root);
    await expect(this.mock.depth()).to.eventually.equal(DEPTH);
    await expect(this.mock.nextLeafIndex()).to.eventually.equal(0n);
  });

  describe('push', function () {
    it('pushing correctly updates the tree', async function () {
      const leaves = [];

      // for each leaf slot
      for (const i in range(2 ** DEPTH)) {
        // generate random leaf
        leaves.push(generators.bytes32());

        // rebuild tree.
        const tree = makeTree(leaves);

        // push
        const tx = await this.mock.push(leaves.at(-1));

        // check root and events
        await expect(tx)
          .to.emit(this.mock, 'LeafInserted')
          .withArgs(leaves.at(-1), i, tree.root);
        await expect(this.mock.root()).to.eventually.equal(tree.root);
        await expect(this.mock.nextLeafIndex()).to.eventually.equal(BigInt(i) + 1n);
      }
    });

    it('tree is full', async function () {
      for (const _ of range(2 ** DEPTH)) {
        await this.mock.push(generators.bytes32());
      }
      await expect(this.mock.push(generators.bytes32())).to.be.revertedWithPanic(
        PANIC_CODES.RESOURCE_ERROR,
      );
    });
  });

  describe('update', function () {
    beforeEach(async function () {
      // push some values
      this.leaves = Array.from({ length: 5 }, generators.bytes32);
      for (const leaf of this.leaves) await this.mock.push(leaf);
    });

    it('updating correctly updates the tree', async function () {
      const newLeaf = generators.bytes32();
      const updateIndex = 2;

      const tree = makeTree(this.leaves);
      const proof = tree.getProof([this.leaves[updateIndex]]);

      const updatedLeaves = [...this.leaves];
      updatedLeaves[updateIndex] = newLeaf;
      const newTree = makeTree(updatedLeaves);

      const tx = await this.mock.update(this.leaves[updateIndex], newLeaf, updateIndex, proof);
      await expect(tx)
        .to.emit(this.mock, 'LeafUpdated')
        .withArgs(this.leaves[updateIndex], newLeaf, updateIndex, newTree.root);
      await expect(this.mock.root()).to.eventually.equal(newTree.root);
    });

    it('updating fails with invalid old root', async function () {
      await expect(
        this.mock.update(generators.bytes32(), generators.bytes32(), 0, []),
      ).to.be.revertedWith('Invalid old root');
    });

    it('updating fails with an invalid proof', async function () {
      const newLeaf = generators.bytes32();
      await expect(
        this.mock.update(this.leaves[0], newLeaf, 0, Array(DEPTH).fill(ethers.ZeroHash)),
      ).to.be.revertedWithCustomError({ interface: (await ethers.getContractFactory('MerkleTreeMock')).interface }, 'MerkleTreeUpdateInvalidProof');
    });

    it('updating fails with an invalid index', async function () {
      const newLeaf = generators.bytes32();
      const tree = makeTree(this.leaves);
      const proof = tree.getProof([this.leaves[0]]);
      await expect(
        this.mock.update(this.leaves[0], newLeaf, 100, proof),
      ).to.be.revertedWithCustomError({ interface: (await ethers.getContractFactory('MerkleTreeMock')).interface }, 'MerkleTreeUpdateInvalidIndex');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Non-commutative hash tests
  // Uses Hashes.efficientKeccak256 = keccak256(abi.encode(a, b)) without sorting.
  // H(a,b) != H(b,a) — insertion order matters.
  // ─────────────────────────────────────────────────────────────────────────────
  describe('non-commutative hash (efficientKeccak256)', function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(nonCommutativeFixture));
    });

    it('initial root matches off-chain computation', async function () {
      await expect(this.mock.root()).to.eventually.equal(NC_INITIAL_ROOT);
    });

    it('initial root differs from commutative-hash root', async function () {
      // Deploy a fresh commutative tree and compare roots.
      const commutativeMock = await ethers.deployContract('MerkleTreeMock');
      await commutativeMock.setup(DEPTH, ZERO);

      const commRoot = await commutativeMock.root();
      const ncRoot = await this.mock.root();
      expect(ncRoot).to.not.equal(commRoot);
    });

    it('push correctly updates the root (matches off-chain computation)', async function () {
      const leaves = [];
      for (const i of range(4)) {
        const leaf = generators.bytes32();
        leaves.push(leaf);

        const tx = await this.mock.pushNonCommutative(leaf);
        const expectedRoot = computePushTreeRoot(leaves, DEPTH, NC_ZERO, efficientKeccak256);

        await expect(tx)
          .to.emit(this.mock, 'LeafInserted')
          .withArgs(leaf, i, expectedRoot);
        await expect(this.mock.root()).to.eventually.equal(expectedRoot);
        await expect(this.mock.nextLeafIndex()).to.eventually.equal(BigInt(i) + 1n);
      }
    });

    it('root is order-sensitive: push(A,B) != push(B,A)', async function () {
      const leafA = generators.bytes32();
      const leafB = generators.bytes32();

      // Tree with A then B
      const mockAB = await ethers.deployContract('MerkleTreeMock');
      await mockAB.setupNonCommutative(DEPTH, NC_ZERO);
      await mockAB.pushNonCommutative(leafA);
      await mockAB.pushNonCommutative(leafB);

      // Tree with B then A
      const mockBA = await ethers.deployContract('MerkleTreeMock');
      await mockBA.setupNonCommutative(DEPTH, NC_ZERO);
      await mockBA.pushNonCommutative(leafB);
      await mockBA.pushNonCommutative(leafA);

      const rootAB = await mockAB.root();
      const rootBA = await mockBA.root();

      // Non-commutative: order of insertion changes the root
      expect(rootAB).to.not.equal(rootBA);
    });

    it('commutative hash: push(A,B) roots match their JS oracle (sanity check)', async function () {
      const leafA = generators.bytes32();
      const leafB = generators.bytes32();

      const mockAB = await ethers.deployContract('MerkleTreeMock');
      await mockAB.setup(DEPTH, ZERO);
      await mockAB.push(leafA);
      await mockAB.push(leafB);

      const jsTreeAB = makeTree([leafA, leafB]);
      await expect(mockAB.root()).to.eventually.equal(jsTreeAB.root);

      const mockBA = await ethers.deployContract('MerkleTreeMock');
      await mockBA.setup(DEPTH, ZERO);
      await mockBA.push(leafB);
      await mockBA.push(leafA);

      const jsTreeBA = makeTree([leafB, leafA]);
      await expect(mockBA.root()).to.eventually.equal(jsTreeBA.root);
    });
  });
});
