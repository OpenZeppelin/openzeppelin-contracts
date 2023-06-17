const { expectRevert } = require('@openzeppelin/test-helpers');

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const { expect } = require('chai');
const { expectRevertCustomError } = require('../../helpers/customError');

const MerkleProof = artifacts.require('$MerkleProof');

contract('MerkleProof', function () {
  beforeEach(async function () {
    this.merkleProof = await MerkleProof.new();
  });

  describe('verify', function () {
    it('returns true for a valid Merkle proof', async function () {
      const elements = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

      const root = merkleTree.getHexRoot();

      const leaf = keccak256(elements[0]);

      const proof = merkleTree.getHexProof(leaf);

      expect(await this.merkleProof.$verify(proof, root, leaf)).to.equal(true);
      expect(await this.merkleProof.$verifyCalldata(proof, root, leaf)).to.equal(true);

      // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
      const noSuchLeaf = keccak256(
        Buffer.concat([keccak256(elements[0]), keccak256(elements[1])].sort(Buffer.compare)),
      );
      expect(await this.merkleProof.$verify(proof.slice(1), root, noSuchLeaf)).to.equal(true);
      expect(await this.merkleProof.$verifyCalldata(proof.slice(1), root, noSuchLeaf)).to.equal(true);
    });

    it('returns false for an invalid Merkle proof', async function () {
      const correctElements = ['a', 'b', 'c'];
      const correctMerkleTree = new MerkleTree(correctElements, keccak256, { hashLeaves: true, sortPairs: true });

      const correctRoot = correctMerkleTree.getHexRoot();

      const correctLeaf = keccak256(correctElements[0]);

      const badElements = ['d', 'e', 'f'];
      const badMerkleTree = new MerkleTree(badElements);

      const badProof = badMerkleTree.getHexProof(badElements[0]);

      expect(await this.merkleProof.$verify(badProof, correctRoot, correctLeaf)).to.equal(false);
      expect(await this.merkleProof.$verifyCalldata(badProof, correctRoot, correctLeaf)).to.equal(false);
    });

    it('returns false for a Merkle proof of invalid length', async function () {
      const elements = ['a', 'b', 'c'];
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

      const root = merkleTree.getHexRoot();

      const leaf = keccak256(elements[0]);

      const proof = merkleTree.getHexProof(leaf);
      const badProof = proof.slice(0, proof.length - 5);

      expect(await this.merkleProof.$verify(badProof, root, leaf)).to.equal(false);
      expect(await this.merkleProof.$verifyCalldata(badProof, root, leaf)).to.equal(false);
    });
  });

  describe('multiProofVerify', function () {
    it('returns true for a valid Merkle multi proof', async function () {
      const leaves = ['a', 'b', 'c', 'd', 'e', 'f'].map(keccak256).sort(Buffer.compare);
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();
      const proofLeaves = ['b', 'f', 'd'].map(keccak256).sort(Buffer.compare);
      const proof = merkleTree.getMultiProof(proofLeaves);
      const proofFlags = merkleTree.getProofFlags(proofLeaves, proof);

      expect(await this.merkleProof.$multiProofVerify(proof, proofFlags, root, proofLeaves)).to.equal(true);
      expect(await this.merkleProof.$multiProofVerifyCalldata(proof, proofFlags, root, proofLeaves)).to.equal(true);
    });

    it('returns false for an invalid Merkle multi proof', async function () {
      const leaves = ['a', 'b', 'c', 'd', 'e', 'f'].map(keccak256).sort(Buffer.compare);
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();
      const badProofLeaves = ['g', 'h', 'i'].map(keccak256).sort(Buffer.compare);
      const badMerkleTree = new MerkleTree(badProofLeaves);
      const badProof = badMerkleTree.getMultiProof(badProofLeaves);
      const badProofFlags = badMerkleTree.getProofFlags(badProofLeaves, badProof);

      expect(await this.merkleProof.$multiProofVerify(badProof, badProofFlags, root, badProofLeaves)).to.equal(false);
      expect(await this.merkleProof.$multiProofVerifyCalldata(badProof, badProofFlags, root, badProofLeaves)).to.equal(
        false,
      );
    });

    it('revert with invalid multi proof #1', async function () {
      const fill = Buffer.alloc(32); // This could be anything, we are reconstructing a fake branch
      const leaves = ['a', 'b', 'c', 'd'].map(keccak256).sort(Buffer.compare);
      const badLeaf = keccak256('e');
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();

      await expectRevertCustomError(
        this.merkleProof.$multiProofVerify(
          [leaves[1], fill, merkleTree.layers[1][1]],
          [false, false, false],
          root,
          [leaves[0], badLeaf], // A, E
        ),
        'MerkleProofInvalidMultiproof',
        [],
      );
      await expectRevertCustomError(
        this.merkleProof.$multiProofVerifyCalldata(
          [leaves[1], fill, merkleTree.layers[1][1]],
          [false, false, false],
          root,
          [leaves[0], badLeaf], // A, E
        ),
        'MerkleProofInvalidMultiproof',
        [],
      );
    });

    it('revert with invalid multi proof #2', async function () {
      const fill = Buffer.alloc(32); // This could be anything, we are reconstructing a fake branch
      const leaves = ['a', 'b', 'c', 'd'].map(keccak256).sort(Buffer.compare);
      const badLeaf = keccak256('e');
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();

      await expectRevert(
        this.merkleProof.$multiProofVerify(
          [leaves[1], fill, merkleTree.layers[1][1]],
          [false, false, false, false],
          root,
          [badLeaf, leaves[0]], // A, E
        ),
        'reverted with panic code 0x32',
      );

      await expectRevert(
        this.merkleProof.$multiProofVerifyCalldata(
          [leaves[1], fill, merkleTree.layers[1][1]],
          [false, false, false, false],
          root,
          [badLeaf, leaves[0]], // A, E
        ),
        'reverted with panic code 0x32',
      );
    });

    it('limit case: works for tree containing a single leaf', async function () {
      const leaves = ['a'].map(keccak256).sort(Buffer.compare);
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();
      const proofLeaves = ['a'].map(keccak256).sort(Buffer.compare);
      const proof = merkleTree.getMultiProof(proofLeaves);
      const proofFlags = merkleTree.getProofFlags(proofLeaves, proof);

      expect(await this.merkleProof.$multiProofVerify(proof, proofFlags, root, proofLeaves)).to.equal(true);
      expect(await this.merkleProof.$multiProofVerifyCalldata(proof, proofFlags, root, proofLeaves)).to.equal(true);
    });

    it('limit case: can prove empty leaves', async function () {
      const leaves = ['a', 'b', 'c', 'd'].map(keccak256).sort(Buffer.compare);
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();
      expect(await this.merkleProof.$multiProofVerify([root], [], root, [])).to.equal(true);
      expect(await this.merkleProof.$multiProofVerifyCalldata([root], [], root, [])).to.equal(true);
    });

    it('reverts processing manipulated proofs with a zero-value node at depth 1', async function () {
      // Create a merkle tree that contains a zero leaf at depth 1
      const leaves = [keccak256('real leaf'), Buffer.alloc(32, 0)];
      const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      const root = merkleTree.getRoot();

      // Now we can pass any **malicious** fake leaves as valid!
      const maliciousLeaves = ['malicious', 'leaves'].map(keccak256).sort(Buffer.compare);
      const maliciousProof = [leaves[0], leaves[0]];
      const maliciousProofFlags = [true, true, false];

      await expectRevertCustomError(
        this.merkleProof.$multiProofVerify(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        'MerkleProofInvalidMultiproof',
        [],
      );

      await expectRevertCustomError(
        this.merkleProof.$multiProofVerifyCalldata(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        'MerkleProofInvalidMultiproof',
        [],
      );
    });
  });
});
