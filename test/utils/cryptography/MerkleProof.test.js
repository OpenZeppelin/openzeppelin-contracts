require('@openzeppelin/test-helpers');

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const { expect } = require('chai');

const MerkleProofWrapper = artifacts.require('MerkleProofWrapper');
const MerkleMultiProofWrapper = artifacts.require('MerkleMultiProofWrapper');

contract('MerkleProof', function (accounts) {
  beforeEach(async function () {
    this.merkleProof = await MerkleProofWrapper.new();
    this.merkleMultiProof = await MerkleMultiProofWrapper.new();
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

  describe('multiProofVerify', function () {
    it('should verify for valid merkle multiproof (example)', async () => {
      const leaves = ['a', 'b', 'c', 'd', 'e', 'f'].map(keccak256).sort(Buffer.compare)
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const root = tree.getRoot()
      const proofLeaves = ['b', 'f', 'd'].map(keccak256).sort(Buffer.compare)
      const proof = tree.getMultiProof(proofLeaves)
      const proofFlags = tree.getProofFlags(proofLeaves, proof)

      const verified = await contract.multiProofVerify.call(root, proofLeaves, proof, proofFlags)
      assert.equal(verified, true)

      expect(await this.merkleMultiProof.verify(root, proofLeafs, proof, proofFlags)).to.equal(true);

    });

    it('should not verify for invalid merkle multiproof', async () => {
      const leaves = ['a', 'b', 'c', 'd', 'e', 'f'].map(keccak256).sort(Buffer.compare)
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const root = tree.getRoot()
      const proofLeaves = ['b', 'f', 'd'].map(keccak256).sort(Buffer.compare)
      const proof = tree.getMultiProof(proofLeaves)
      const proofFlags = tree.getProofFlags(proofLeaves, proof)
      proofFlags[proofFlags.length - 1] = !proofFlags[proofFlags.length - 1]

      let errMessage = ''
      try {
        await contract.multiProofVerify.call(root, proofLeaves, proof, proofFlags)
      } catch (err) {
        errMessage = err.message
      }

      assert.equal(errMessage, 'Returned error: VM Exception while processing transaction: invalid opcode')
    });
  });
});