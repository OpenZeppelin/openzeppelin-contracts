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
        const hash = tree.leafHash(tree.at(i));

        // push value to tree
        await expect(this.mock.push(hash)).to.emit(this.mock, 'LeafInserted').withArgs(hash, i, tree.root);

        // check tree
        await expect(this.mock.root()).to.eventually.equal(tree.root);
        await expect(this.mock.nextLeafIndex()).to.eventually.equal(BigInt(i) + 1n);
      }
    });

    it('pushing to a full tree reverts', async function () {
      await Promise.all(Array.from({ length: 2 ** Number(DEPTH) }).map(() => this.mock.push(ethers.ZeroHash)));

      await expect(this.mock.push(ethers.ZeroHash)).to.be.revertedWithPanic(PANIC_CODES.TOO_MUCH_MEMORY_ALLOCATED);
    });
  });

  describe('update', function () {
    for (const { leafCount, leafIndex } of range(2 ** DEPTH + 1).flatMap(leafCount =>
      range(leafCount).map(leafIndex => ({ leafCount, leafIndex })),
    ))
      it(`updating a leaf correctly updates the tree (leaf #${leafIndex + 1}/${leafCount})`, async function () {
        // initial tree
        const leaves = Array.from({ length: leafCount }, generators.bytes32);
        const oldTree = makeTree(leaves);

        // fill tree and verify root
        for (const i in leaves) {
          await this.mock.push(oldTree.leafHash(oldTree.at(i)));
        }
        await expect(this.mock.root()).to.eventually.equal(oldTree.root);

        // create updated tree
        leaves[leafIndex] = generators.bytes32();
        const newTree = makeTree(leaves);

        const oldLeafHash = oldTree.leafHash(oldTree.at(leafIndex));
        const newLeafHash = newTree.leafHash(newTree.at(leafIndex));

        // perform update
        await expect(this.mock.update(leafIndex, oldLeafHash, newLeafHash, oldTree.getProof(leafIndex)))
          .to.emit(this.mock, 'LeafUpdated')
          .withArgs(oldLeafHash, newLeafHash, leafIndex, newTree.root);

        // verify updated root
        await expect(this.mock.root()).to.eventually.equal(newTree.root);

        // if there is still room in the tree, fill it
        for (const i of range(leafCount, 2 ** DEPTH)) {
          // push new value and rebuild tree
          leaves.push(generators.bytes32());
          const nextTree = makeTree(leaves);

          // push and verify root
          await this.mock.push(nextTree.leafHash(nextTree.at(i)));
          await expect(this.mock.root()).to.eventually.equal(nextTree.root);
        }
      });

    it('replacing a leaf that was not previously pushed reverts', async function () {
      // changing leaf 0 on an empty tree
      await expect(this.mock.update(1, ZERO, ZERO, []))
        .to.be.revertedWithCustomError(this.mock, 'MerkleTreeUpdateInvalidIndex')
        .withArgs(1, 0);
    });

    it('replacing a leaf using an invalid proof reverts', async function () {
      const leafCount = 4;
      const leafIndex = 2;

      const leaves = Array.from({ length: leafCount }, generators.bytes32);
      const tree = makeTree(leaves);

      // fill tree and verify root
      for (const i in leaves) {
        await this.mock.push(tree.leafHash(tree.at(i)));
      }
      await expect(this.mock.root()).to.eventually.equal(tree.root);

      const oldLeafHash = tree.leafHash(tree.at(leafIndex));
      const newLeafHash = generators.bytes32();
      const proof = tree.getProof(leafIndex);
      // invalid proof (tamper)
      proof[1] = generators.bytes32();

      await expect(this.mock.update(leafIndex, oldLeafHash, newLeafHash, proof)).to.be.revertedWithCustomError(
        this.mock,
        'MerkleTreeUpdateInvalidProof',
      );
    });
  });

  it('reset', async function () {
    // empty tree
    const emptyTree = makeTree();

    // tree with one element
    const leaves = [generators.bytes32()];
    const tree = makeTree(leaves);
    const hash = tree.leafHash(tree.at(0));

    // root should be that of a zero tree
    expect(await this.mock.root()).to.equal(emptyTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // push leaf and check root
    await expect(this.mock.push(hash)).to.emit(this.mock, 'LeafInserted').withArgs(hash, 0, tree.root);

    expect(await this.mock.root()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);

    // reset tree
    await this.mock.setup(DEPTH, ZERO);

    expect(await this.mock.root()).to.equal(emptyTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // re-push leaf and check root
    await expect(this.mock.push(hash)).to.emit(this.mock, 'LeafInserted').withArgs(hash, 0, tree.root);

    expect(await this.mock.root()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);
  });
});
