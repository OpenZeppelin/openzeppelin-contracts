const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const makeTree = (leafs = [ethers.ZeroHash]) =>
  StandardMerkleTree.of(
    leafs.map(leaf => [leaf]),
    ['bytes32'],
    { sortLeaves: false },
  );

const MAX_DEPTH = 255n;
const DEPTH = 4n; // 16 slots
const ZERO = makeTree().leafHash([ethers.ZeroHash]);

async function fixture() {
  return { mock: await ethers.deployContract('MerkleTreeMock', [DEPTH, ZERO]) };
}

describe('Merklee tree', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('depth is limited', async function () {
    const invalidDepth = MAX_DEPTH + 1n;
    await expect(ethers.deployContract('MerkleTreeMock', [invalidDepth, ZERO]))
      .to.be.revertedWithCustomError({ interface: this.mock.interface }, 'MerkleTreeInvalidDepth')
      .withArgs(invalidDepth, MAX_DEPTH);
  });

  it('setup', async function () {
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
        leafs[i] = ethers.randomBytes(32);

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
});
