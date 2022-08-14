const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { expect } = require('chai');

const MerkleTreeMock = artifacts.require('MerkleTreeMock');

describe('Merklee tree', function () {
  const DEPTH = new BN(4);
  const LENGTH = new BN(10);

  beforeEach(async function () {
    this.contract = await MerkleTreeMock.new(DEPTH, LENGTH);
  });

  it('depth is limited', async function () {
    await expectRevert(
      MerkleTreeMock.new(256, LENGTH),
      'MerkleTree: invalid length',
    );
  });

  it('setup', async function () {
    const leafs = Array(2 ** DEPTH).fill(constants.ZERO_BYTES32);
    const merkleTree = new MerkleTree(leafs, keccak256, { sortPairs: true });

    expect(await this.contract.getDepth()).to.be.bignumber.equal(DEPTH);
    expect(await this.contract.getLength()).to.be.bignumber.equal(LENGTH);
    expect(await this.contract.currentRootIndex()).to.be.bignumber.equal('0');
    expect(await this.contract.nextLeafIndex()).to.be.bignumber.equal('0');

    expect(await this.contract.getLastRoot()).to.be.equal(merkleTree.getHexRoot());
    for (let i = 0; i < DEPTH; ++i) {
      expect(await this.contract.zeros(i)).to.be.equal(merkleTree.getHexLayers()[i][0]);
      expect(await this.contract.sides(i)).to.be.equal(constants.ZERO_BYTES32);
    }

    for (let i = 0; i < LENGTH; ++i) {
      expect(await this.contract.roots(i)).to.be.equal(i === 0 ? merkleTree.getHexRoot() : constants.ZERO_BYTES32);
    }

    expect(await this.contract.isKnownRoot(merkleTree.getHexRoot())).to.be.equal(true);
    expect(await this.contract.isKnownRoot(constants.ZERO_BYTES32)).to.be.equal(false);
  });

  describe('insert', function () {
    it('tree is correctly updated', async function () {
      const leafs = Array(2 ** DEPTH).fill(constants.ZERO_BYTES32);
      const roots = [];

      // for each entry
      for (const i of Object.keys(leafs).map(Number)) {
        // generate random leaf
        leafs[i] = web3.utils.randomHex(32);
        const merkleTree = new MerkleTree(leafs, keccak256, { sortPairs: true });

        // insert leaf
        await this.contract.insert(leafs[i]);

        // check tree
        expect(await this.contract.currentRootIndex()).to.be.bignumber.equal(((i + 1) % LENGTH).toString());
        expect(await this.contract.nextLeafIndex()).to.be.bignumber.equal((i + 1).toString());
        expect(await this.contract.getLastRoot()).to.be.equal(merkleTree.getHexRoot());

        // check root history
        roots.push(merkleTree.getHexRoot());
        for (const root of roots.slice(0, -LENGTH)) {
          expect(await this.contract.isKnownRoot(root)).to.be.equal(false);
        }
        for (const root of roots.slice(-LENGTH)) {
          expect(await this.contract.isKnownRoot(root)).to.be.equal(true);
        }
      }
    });

    it('revert when tree is full', async function () {
      for (let i = 0; i < 2 ** DEPTH; ++i) {
        await this.contract.insert(constants.ZERO_BYTES32);
      }
      await expectRevert(
        this.contract.insert(constants.ZERO_BYTES32),
        'Full()',
      );
    });
  });
});
