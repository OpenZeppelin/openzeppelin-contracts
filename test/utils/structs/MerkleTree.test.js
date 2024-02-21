const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const { generators } = require('../../helpers/random');

const makeTree = (leafs = [ethers.ZeroHash]) =>
  StandardMerkleTree.of(
    leafs.map(leaf => [leaf]),
    ['bytes32'],
    { sortLeaves: false },
  );

const DEPTH = 4n; // 16 slots
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
    const merkleTree = makeTree(Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash));

    expect(await this.mock.getRoot()).to.equal(merkleTree.root);
    expect(await this.mock.getDepth()).to.equal(DEPTH);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);
  });

  describe('insert', function () {
    it('tree is correctly updated', async function () {
      const leafs = Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash);

      // for each leaf slot
      for (const i in leafs) {
        // generate random leaf
        leafs[i] = generators.bytes32();

        // update leaf list and rebuild tree.
        const merkleTree = makeTree(leafs);

        // insert value in tree
        await this.mock.insert(merkleTree.leafHash([leafs[i]]));

        // check tree
        expect(await this.mock.getRoot()).to.equal(merkleTree.root);
        expect(await this.mock.nextLeafIndex()).to.equal(BigInt(i) + 1n);
      }
    });

    it('revert when tree is full', async function () {
      await Promise.all(Array.from({ length: 2 ** Number(DEPTH) }).map(() => this.mock.insert(ethers.ZeroHash)));

      await expect(this.mock.insert(ethers.ZeroHash)).to.be.revertedWithPanic(PANIC_CODES.TOO_MUCH_MEMORY_ALLOCATED);
    });
  });

  it('reset', async function () {
    // empty tree
    const zeroLeafs = Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash);
    const zeroTree = makeTree(zeroLeafs);

    // tree with one element
    const leafs = Array.from({ length: 2 ** Number(DEPTH) }, (_, i) => i == 0 ? generators.bytes32() : ethers.ZeroHash);
    const tree = makeTree(leafs);

    // root should that of zero tree
    expect(await this.mock.getRoot()).to.equal(zeroTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // insert leaf and check root
    await this.mock.insert(tree.leafHash([leafs[0]]));
    expect(await this.mock.getRoot()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);

    // reset tree
    await this.mock.setup(DEPTH, ZERO);
    expect(await this.mock.getRoot()).to.equal(zeroTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // re-insert leaf and check root
    await this.mock.insert(tree.leafHash([leafs[0]]));
    expect(await this.mock.getRoot()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);
  });
});
