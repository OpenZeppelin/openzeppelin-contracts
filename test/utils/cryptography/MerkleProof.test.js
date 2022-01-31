require('@openzeppelin/test-helpers');

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const { expect } = require('chai');

const MerkleProofWrapper = artifacts.require('MerkleProofWrapper');

contract('MerkleProof', function (accounts) {
  beforeEach(async function () {
    this.merkleProof = await MerkleProofWrapper.new();
  });

  describe('verify', function () {
    it('returns true for a valid Merkle proof', async function () {
      const elements = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

      const root = merkleTree.getHexRoot();

      const leaf = keccak256(elements[0]);

      const proof = merkleTree.getHexProof(leaf);

      expect(await this.merkleProof.verify(proof, root, leaf)).to.equal(true);

      // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
      const noSuchLeaf = keccak256(
        Buffer.concat([keccak256(elements[0]), keccak256(elements[1])].sort(Buffer.compare)),
      );
      expect(await this.merkleProof.verify(proof.slice(1), root, noSuchLeaf)).to.equal(true);
    });

    it('returns false for an invalid Merkle proof', async function () {
      const correctElements = ['a', 'b', 'c'];
      const correctMerkleTree = new MerkleTree(correctElements, keccak256, { hashLeaves: true, sortPairs: true });

      const correctRoot = correctMerkleTree.getHexRoot();

      const correctLeaf = keccak256(correctElements[0]);

      const badElements = ['d', 'e', 'f'];
      const badMerkleTree = new MerkleTree(badElements);

      const badProof = badMerkleTree.getHexProof(badElements[0]);

      expect(await this.merkleProof.verify(badProof, correctRoot, correctLeaf)).to.equal(false);
    });

    it('returns false for a Merkle proof of invalid length', async function () {
      const elements = ['a', 'b', 'c'];
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

      const root = merkleTree.getHexRoot();

      const leaf = keccak256(elements[0]);

      const proof = merkleTree.getHexProof(leaf);
      const badProof = proof.slice(0, proof.length - 5);

      expect(await this.merkleProof.verify(badProof, root, leaf)).to.equal(false);
    });
  });
});
