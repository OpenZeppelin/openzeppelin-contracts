const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const { generators } = require('../../helpers/random');

const makeTree = (leaves = [ethers.ZeroHash]) =>
  StandardMerkleTree.of(
    leaves.map(leaf => [leaf]),
    ['bytes32'],
    { sortLeaves: false },
  );

const hashLeaf = leaf => makeTree().leafHash([leaf]);

const DEPTH = 4n; // 16 slots
const ZERO = hashLeaf(ethers.ZeroHash);

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

    expect(await this.mock.root()).to.equal(merkleTree.root);
    expect(await this.mock.depth()).to.equal(DEPTH);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);
  });

  describe('push', function () {
    it('tree is correctly updated', async function () {
      const leaves = Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash);

      // for each leaf slot
      for (const i in leaves) {
        // generate random leaf and hash it
        const hashedLeaf = hashLeaf((leaves[i] = generators.bytes32()));

        // update leaf list and rebuild tree.
        const tree = makeTree(leaves);

        // push value to tree
        await expect(this.mock.push(hashedLeaf)).to.emit(this.mock, 'LeafInserted').withArgs(hashedLeaf, i, tree.root);

        // check tree
        expect(await this.mock.root()).to.equal(tree.root);
        expect(await this.mock.nextLeafIndex()).to.equal(BigInt(i) + 1n);
      }
    });

    it('revert when tree is full', async function () {
      await Promise.all(Array.from({ length: 2 ** Number(DEPTH) }).map(() => this.mock.push(ethers.ZeroHash)));

      await expect(this.mock.push(ethers.ZeroHash)).to.be.revertedWithPanic(PANIC_CODES.TOO_MUCH_MEMORY_ALLOCATED);
    });
  });

  it('reset', async function () {
    // empty tree
    const zeroLeaves = Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash);
    const zeroTree = makeTree(zeroLeaves);

    // tree with one element
    const leaves = Array.from({ length: 2 ** Number(DEPTH) }, () => ethers.ZeroHash);
    const hashedLeaf = hashLeaf((leaves[0] = generators.bytes32())); // fill first leaf and hash it
    const tree = makeTree(leaves);

    // root should be that of a zero tree
    expect(await this.mock.root()).to.equal(zeroTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // push leaf and check root
    await expect(this.mock.push(hashedLeaf)).to.emit(this.mock, 'LeafInserted').withArgs(hashedLeaf, 0, tree.root);

    expect(await this.mock.root()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);

    // reset tree
    await this.mock.setup(DEPTH, ZERO);

    expect(await this.mock.root()).to.equal(zeroTree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);

    // re-push leaf and check root
    await expect(this.mock.push(hashedLeaf)).to.emit(this.mock, 'LeafInserted').withArgs(hashedLeaf, 0, tree.root);

    expect(await this.mock.root()).to.equal(tree.root);
    expect(await this.mock.nextLeafIndex()).to.equal(1n);
  });
});
