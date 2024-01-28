const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const makeTree = (leafs = [ethers.ZeroHash]) =>
  StandardMerkleTree.of(
    leafs.map(leaf => [leaf]),
    ['bytes32'],
    { sortLeaves: false },
  );

const MAX_DEPTH = 255n;
const DEPTH = 4n; // 16 slots
const LENGTH = 8n;
const ZERO = makeTree().leafHash([ethers.ZeroHash]);

async function fixture() {
  return { mock: await ethers.deployContract('MerkleTreeMock', [DEPTH, LENGTH, ZERO]) };
}

describe('Merklee tree', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('depth is limited', async function () {
    const invalidDepth = MAX_DEPTH + 1n;
    await expect(ethers.deployContract('MerkleTreeMock', [invalidDepth, LENGTH, ZERO]))
      .to.be.revertedWithCustomError({ interface: this.mock.interface }, 'MerkleTreeInvalidDepth')
      .withArgs(invalidDepth, MAX_DEPTH);
  });

  it('setup', async function () {
    const merkleTree = makeTree(Array(2 ** Number(DEPTH)).fill(ethers.ZeroHash));

    expect(await this.mock.getDepth()).to.equal(DEPTH);
    expect(await this.mock.getLength()).to.equal(LENGTH);
    expect(await this.mock.currentRootIndex()).to.equal(0n);
    expect(await this.mock.nextLeafIndex()).to.equal(0n);
    expect(await this.mock.getLastRoot()).to.equal(merkleTree.root);

    for (let i = 0; i < LENGTH; ++i) {
      expect(await this.mock.roots(i)).to.equal(i === 0 ? merkleTree.root : ethers.ZeroHash);
    }

    expect(await this.mock.isKnownRoot(merkleTree.root)).to.be.true;
    expect(await this.mock.isKnownRoot(ethers.ZeroHash)).to.be.false;
  });

  describe('insert', function () {
    it('tree is correctly updated', async function () {
      const leafs = Array(2 ** Number(DEPTH)).fill(ethers.ZeroHash);
      const roots = [];

      // for each leaf slot
      for (const i in leafs) {
        // generate random leaf
        leafs[i] = ethers.randomBytes(32);

        // update leaf list and rebuild tree.
        const merkleTree = makeTree(leafs);

        // insert value in tree
        await this.mock.insert(merkleTree.leafHash([leafs[i]]));

        // check tree
        expect(await this.mock.currentRootIndex()).to.equal((BigInt(i) + 1n) % LENGTH);
        expect(await this.mock.nextLeafIndex()).to.equal(BigInt(i) + 1n);
        expect(await this.mock.getLastRoot()).to.equal(merkleTree.root);

        // check root history
        roots.push(merkleTree.root);
        for (const root of roots.slice(0, -Number(LENGTH))) {
          expect(await this.mock.isKnownRoot(root)).to.be.false;
        }
        for (const root of roots.slice(-Number(LENGTH))) {
          expect(await this.mock.isKnownRoot(root)).to.be.true;
        }
      }
    });

    it('revert when tree is full', async function () {
      for (let i = 0; i < 2 ** Number(DEPTH); ++i) {
        await this.mock.insert(ethers.ZeroHash);
      }
      await expect(this.mock.insert(ethers.ZeroHash)).to.be.revertedWithCustomError(this.mock, 'MerkleTreeFull');
    });
  });
});
