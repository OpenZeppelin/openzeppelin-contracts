const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { StandardMerkleTree } = require('@openzeppelin/merkle-tree');

const toElements = str => str.split('').map(e => [e]);
const hashPair = (a, b) => ethers.keccak256(Buffer.concat([a, b].sort(Buffer.compare)));

async function fixture() {
  const mock = await ethers.deployContract('$MerkleProof');
  return { mock };
}

describe('MerkleProof', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('verify', function () {
    it('returns true for a valid Merkle proof', async function () {
      const merkleTree = StandardMerkleTree.of(
        toElements('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='),
        ['string'],
      );

      const root = merkleTree.root;
      const hash = merkleTree.leafHash(['A']);
      const proof = merkleTree.getProof(['A']);

      expect(await this.mock.$verify(proof, root, hash)).to.be.true;
      expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.true;

      // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
      const noSuchLeaf = hashPair(
        ethers.toBeArray(merkleTree.leafHash(['A'])),
        ethers.toBeArray(merkleTree.leafHash(['B'])),
      );
      expect(await this.mock.$verify(proof.slice(1), root, noSuchLeaf)).to.be.true;
      expect(await this.mock.$verifyCalldata(proof.slice(1), root, noSuchLeaf)).to.be.true;
    });

    it('returns false for an invalid Merkle proof', async function () {
      const correctMerkleTree = StandardMerkleTree.of(toElements('abc'), ['string']);
      const otherMerkleTree = StandardMerkleTree.of(toElements('def'), ['string']);

      const root = correctMerkleTree.root;
      const hash = correctMerkleTree.leafHash(['a']);
      const proof = otherMerkleTree.getProof(['d']);

      expect(await this.mock.$verify(proof, root, hash)).to.be.false;
      expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.false;
    });

    it('returns false for a Merkle proof of invalid length', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abc'), ['string']);

      const root = merkleTree.root;
      const hash = merkleTree.leafHash(['a']);
      const proof = merkleTree.getProof(['a']);
      const badProof = proof.slice(0, -1);

      expect(await this.mock.$verify(badProof, root, hash)).to.be.false;
      expect(await this.mock.$verifyCalldata(badProof, root, hash)).to.be.false;
    });
  });

  describe('multiProofVerify', function () {
    it('returns true for a valid Merkle multi proof', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abcdef'), ['string']);

      const root = merkleTree.root;
      const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toElements('bdf'));
      const hashes = leaves.map(e => merkleTree.leafHash(e));

      expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
      expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
    });

    it('returns false for an invalid Merkle multi proof', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abcdef'), ['string']);
      const otherMerkleTree = StandardMerkleTree.of(toElements('ghi'), ['string']);

      const root = merkleTree.root;
      const { proof, proofFlags, leaves } = otherMerkleTree.getMultiProof(toElements('ghi'));
      const hashes = leaves.map(e => merkleTree.leafHash(e));

      expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.false;
      expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.false;
    });

    it('revert with invalid multi proof #1', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abcd'), ['string']);

      const root = merkleTree.root;
      const hashA = merkleTree.leafHash(['a']);
      const hashB = merkleTree.leafHash(['b']);
      const hashCD = hashPair(
        ethers.toBeArray(merkleTree.leafHash(['c'])),
        ethers.toBeArray(merkleTree.leafHash(['d'])),
      );
      const hashE = merkleTree.leafHash(['e']); // incorrect (not part of the tree)
      const fill = ethers.randomBytes(32);

      await expect(
        this.mock.$multiProofVerify([hashB, fill, hashCD], [false, false, false], root, [hashA, hashE]),
      ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

      await expect(
        this.mock.$multiProofVerifyCalldata([hashB, fill, hashCD], [false, false, false], root, [hashA, hashE]),
      ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');
    });

    it('revert with invalid multi proof #2', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abcd'), ['string']);

      const root = merkleTree.root;
      const hashA = merkleTree.leafHash(['a']);
      const hashB = merkleTree.leafHash(['b']);
      const hashCD = hashPair(
        ethers.toBeArray(merkleTree.leafHash(['c'])),
        ethers.toBeArray(merkleTree.leafHash(['d'])),
      );
      const hashE = merkleTree.leafHash(['e']); // incorrect (not part of the tree)
      const fill = ethers.randomBytes(32);

      await expect(
        this.mock.$multiProofVerify([hashB, fill, hashCD], [false, false, false, false], root, [hashE, hashA]),
      ).to.be.revertedWithPanic(0x32);

      await expect(
        this.mock.$multiProofVerifyCalldata([hashB, fill, hashCD], [false, false, false, false], root, [hashE, hashA]),
      ).to.be.revertedWithPanic(0x32);
    });

    it('limit case: works for tree containing a single leaf', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('a'), ['string']);

      const root = merkleTree.root;
      const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toElements('a'));
      const hashes = leaves.map(e => merkleTree.leafHash(e));

      expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
      expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
    });

    it('limit case: can prove empty leaves', async function () {
      const merkleTree = StandardMerkleTree.of(toElements('abcd'), ['string']);

      const root = merkleTree.root;
      expect(await this.mock.$multiProofVerify([root], [], root, [])).to.be.true;
      expect(await this.mock.$multiProofVerifyCalldata([root], [], root, [])).to.be.true;
    });

    it('reverts processing manipulated proofs with a zero-value node at depth 1', async function () {
      // Create a merkle tree that contains a zero leaf at depth 1
      const leave = ethers.id('real leaf');
      const root = hashPair(ethers.toBeArray(leave), Buffer.alloc(32, 0));

      // Now we can pass any **malicious** fake leaves as valid!
      const maliciousLeaves = ['malicious', 'leaves'].map(ethers.id).map(ethers.toBeArray).sort(Buffer.compare);
      const maliciousProof = [leave, leave];
      const maliciousProofFlags = [true, true, false];

      await expect(
        this.mock.$multiProofVerify(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
      ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

      await expect(
        this.mock.$multiProofVerifyCalldata(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
      ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');
    });
  });
});
