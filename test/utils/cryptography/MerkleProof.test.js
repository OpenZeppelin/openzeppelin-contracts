require('@openzeppelin/test-helpers');

const { expectRevert } = require('@openzeppelin/test-helpers');
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
      expect(await this.merkleProof.verifyCall(proof, root, leaf)).to.equal(true);

      // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
      const noSuchLeaf = keccak256(
        Buffer.concat([keccak256(elements[0]), keccak256(elements[1])].sort(Buffer.compare)),
      );
      expect(await this.merkleProof.verify(proof.slice(1), root, noSuchLeaf)).to.equal(true);
      expect(await this.merkleProof.verifyCall(proof.slice(1), root, noSuchLeaf)).to.equal(true);
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
      expect(await this.merkleProof.verifyCall(badProof, correctRoot, correctLeaf)).to.equal(false);
    });

    it('returns false for a Merkle proof of invalid length', async function () {
      const elements = ['a', 'b', 'c'];
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

      const root = merkleTree.getHexRoot();

      const leaf = keccak256(elements[0]);

      const proof = merkleTree.getHexProof(leaf);
      const badProof = proof.slice(0, proof.length - 5);

      expect(await this.merkleProof.verify(badProof, root, leaf)).to.equal(false);
      expect(await this.merkleProof.verifyCall(badProof, root, leaf)).to.equal(false);
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

      expect(await this.merkleProof.multiProofVerify(root, proofLeaves, proof, proofFlags)).to.equal(true);
      expect(await this.merkleProof.multiProofVerifyCall(root, proofLeaves, proof, proofFlags)).to.equal(true);
    });

    it('returns false for an invalid Merkle multi proof', async function () {
      const leaves = ['a', 'b', 'c', 'd', 'e', 'f'].map(keccak256).sort(Buffer.compare);
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();
      const badProofLeaves = ['g', 'h', 'i'].map(keccak256).sort(Buffer.compare);
      const badMerkleTree = new MerkleTree(badProofLeaves);
      const badProof = badMerkleTree.getMultiProof(badProofLeaves);
      const badProofFlags = badMerkleTree.getProofFlags(badProofLeaves, badProof);

      expect(await this.merkleProof.multiProofVerify(root, badProofLeaves, badProof, badProofFlags)).to.equal(false);
      expect(await this.merkleProof.multiProofVerifyCall(root, badProofLeaves, badProof, badProofFlags)).to.equal(false);
    });

    it('revert with invalid multi proof #1', async function () {
      const fill = Buffer.alloc(32); // This could be anything, we are reconstructing a fake branch
      const leaves = ['a', 'b', 'c', 'd'].map(keccak256).sort(Buffer.compare);
      const badLeave = keccak256('e');
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();

      await expectRevert(
        this.merkleProof.multiProofVerify(
          root,
          [ leaves[0], badLeave ], // A, E
          [ leaves[1], fill, merkleTree.layers[1][1] ],
          [ false, false, false ],
        ),
        'MerkleProof: invalid multiproof',
      );

      await expectRevert(
        this.merkleProof.multiProofVerifyCall(
          root,
          [ leaves[0], badLeave ], // A, E
          [ leaves[1], fill, merkleTree.layers[1][1] ],
          [ false, false, false ],
        ),
        'MerkleProof: invalid multiproof',
      );
    });

    it('revert with invalid multi proof #2', async function () {
      const fill = Buffer.alloc(32); // This could be anything, we are reconstructing a fake branch
      const leaves = ['a', 'b', 'c', 'd'].map(keccak256).sort(Buffer.compare);
      const badLeave = keccak256('e');
      const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

      const root = merkleTree.getRoot();

      await expectRevert(
        this.merkleProof.multiProofVerify(
          root,
          [ badLeave, leaves[0] ], // A, E
          [ leaves[1], fill, merkleTree.layers[1][1] ],
          [ false, false, false, false ],
        ),
        'reverted with panic code 0x32',
      );

      await expectRevert(
        this.merkleProof.multiProofVerifyCall(
          root,
          [ badLeave, leaves[0] ], // A, E
          [ leaves[1], fill, merkleTree.layers[1][1] ],
          [ false, false, false, false ],
        ),
        'reverted with panic code 0x32',
      );
    });
  });
});
