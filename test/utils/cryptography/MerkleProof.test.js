const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { StandardMerkleTree, SimpleMerkleTree } = require('@openzeppelin/merkle-tree');

const toElements = str => str.split('').map(e => [e]);
const toBytesElements = str => str.split('').map(e => ethers.keccak256(ethers.toUtf8Bytes(e)));
const hashSorted = (...elements) => ethers.keccak256(Buffer.concat(elements.map(ethers.getBytes).sort(Buffer.compare)));
const defaultHash = (a, b) => hashSorted(a, b);
const customHash = (a, b) => hashSorted(ethers.ZeroHash, a, b);

async function fixture() {
  const mock = await ethers.deployContract('$MerkleProof');
  const custommock = await ethers.deployContract('$MerkleProofCustomHashMock');
  return { mock, custommock };
}

describe('MerkleProof', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('default hash', function () {
    describe('verify', function () {
      it('returns true for a valid Merkle proof', async function () {
        const merkleTree = StandardMerkleTree.of(
          toElements('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='),
          ['string'],
        );

        const root = merkleTree.root;
        const hash = merkleTree.leafHash(['A']);
        const proof = merkleTree.getProof(['A']);

        expect(await this.mock.$processProof(proof, hash)).to.equal(root);
        expect(await this.mock.$processProofCalldata(proof, hash)).to.equal(root);
        expect(await this.mock.$verify(proof, root, hash)).to.be.true;
        expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.true;

        // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
        const noSuchLeaf = defaultHash(hash, proof.at(0));

        expect(await this.mock.$processProof(proof.slice(1), noSuchLeaf)).to.equal(root);
        expect(await this.mock.$processProofCalldata(proof.slice(1), noSuchLeaf)).to.equal(root);
        expect(await this.mock.$verify(proof.slice(1), root, noSuchLeaf)).to.be.true;
        expect(await this.mock.$verifyCalldata(proof.slice(1), root, noSuchLeaf)).to.be.true;
      });

      it('returns false for an invalid Merkle proof', async function () {
        const correctMerkleTree = StandardMerkleTree.of(toElements('abc'), ['string']);
        const otherMerkleTree = StandardMerkleTree.of(toElements('def'), ['string']);

        const root = correctMerkleTree.root;
        const hash = correctMerkleTree.leafHash(['a']);
        const proof = otherMerkleTree.getProof(['d']);

        expect(await this.mock.$processProof(proof, hash)).to.not.equal(root);
        expect(await this.mock.$processProofCalldata(proof, hash)).to.not.equal(root);
        expect(await this.mock.$verify(proof, root, hash)).to.be.false;
        expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.false;
      });

      it('returns false for a Merkle proof of invalid length', async function () {
        const merkleTree = StandardMerkleTree.of(toElements('abc'), ['string']);

        const root = merkleTree.root;
        const hash = merkleTree.leafHash(['a']);
        const proof = merkleTree.getProof(['a']);
        const badProof = proof.slice(0, -1);

        expect(await this.mock.$processProof(badProof, hash)).to.not.equal(root);
        expect(await this.mock.$processProofCalldata(badProof, hash)).to.not.equal(root);
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

        expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.equal(root);
        expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.equal(root);
        expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
        expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
      });

      it('returns false for an invalid Merkle multi proof', async function () {
        const merkleTree = StandardMerkleTree.of(toElements('abcdef'), ['string']);
        const otherMerkleTree = StandardMerkleTree.of(toElements('ghi'), ['string']);

        const root = merkleTree.root;
        const { proof, proofFlags, leaves } = otherMerkleTree.getMultiProof(toElements('ghi'));
        const hashes = leaves.map(e => merkleTree.leafHash(e));

        expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.not.equal(root);
        expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.not.equal(root);
        expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.false;
        expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.false;
      });

      it('revert with invalid multi proof #1', async function () {
        const merkleTree = StandardMerkleTree.of(toElements('abcd'), ['string']);

        const root = merkleTree.root;
        const hashA = merkleTree.leafHash(['a']);
        const hashB = merkleTree.leafHash(['b']);
        const hashCD = defaultHash(merkleTree.leafHash(['c']), merkleTree.leafHash(['d']));
        const hashE = merkleTree.leafHash(['e']); // incorrect (not part of the tree)
        const fill = ethers.randomBytes(32);

        await expect(
          this.mock.$processMultiProof([hashB, fill, hashCD], [false, false, false], [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$processMultiProofCalldata([hashB, fill, hashCD], [false, false, false], [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

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
        const hashCD = defaultHash(merkleTree.leafHash(['c']), merkleTree.leafHash(['d']));
        const hashE = merkleTree.leafHash(['e']); // incorrect (not part of the tree)
        const fill = ethers.randomBytes(32);

        await expect(
          this.mock.$processMultiProof([hashB, fill, hashCD], [false, false, false, false], [hashE, hashA]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.mock.$processMultiProofCalldata([hashB, fill, hashCD], [false, false, false, false], [hashE, hashA]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.mock.$multiProofVerify([hashB, fill, hashCD], [false, false, false, false], root, [hashE, hashA]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.mock.$multiProofVerifyCalldata([hashB, fill, hashCD], [false, false, false, false], root, [
            hashE,
            hashA,
          ]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      });

      it('limit case: works for tree containing a single leaf', async function () {
        const merkleTree = StandardMerkleTree.of(toElements('a'), ['string']);

        const root = merkleTree.root;
        const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toElements('a'));
        const hashes = leaves.map(e => merkleTree.leafHash(e));

        expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.equal(root);
        expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.equal(root);
        expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
        expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
      });

      it('limit case: can prove empty leaves', async function () {
        const merkleTree = StandardMerkleTree.of(toElements('abcd'), ['string']);

        const root = merkleTree.root;
        expect(await this.mock.$processMultiProof([root], [], [])).to.equal(root);
        expect(await this.mock.$processMultiProofCalldata([root], [], [])).to.equal(root);
        expect(await this.mock.$multiProofVerify([root], [], root, [])).to.be.true;
        expect(await this.mock.$multiProofVerifyCalldata([root], [], root, [])).to.be.true;
      });

      it('reverts processing manipulated proofs with a zero-value node at depth 1', async function () {
        // Create a merkle tree that contains a zero leaf at depth 1
        const leave = ethers.id('real leaf');
        const root = defaultHash(leave, ethers.ZeroHash);

        // Now we can pass any **malicious** fake leaves as valid!
        const maliciousLeaves = ['malicious', 'leaves'].map(ethers.id).map(ethers.toBeArray).sort(Buffer.compare);
        const maliciousProof = [leave, leave];
        const maliciousProofFlags = [true, true, false];

        await expect(
          this.mock.$processMultiProof(maliciousProof, maliciousProofFlags, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$processMultiProofCalldata(maliciousProof, maliciousProofFlags, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$multiProofVerify(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$multiProofVerifyCalldata(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');
      });
    });
  });

  describe('custom hash', function () {
    describe('verify', function () {
      it('returns true for a valid Merkle proof', async function () {
        const merkleTree = SimpleMerkleTree.of(
          toBytesElements('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='),
          { nodeHash: customHash },
        );
        const root = merkleTree.root;
        const hash = merkleTree.at(0);
        const proof = merkleTree.getProof(0);

        expect(await this.custommock.processProof(proof, hash)).to.equal(root);
        expect(await this.custommock.processProofCalldata(proof, hash)).to.equal(root);
        expect(await this.custommock.verify(proof, root, hash)).to.be.true;
        expect(await this.custommock.verifyCalldata(proof, root, hash)).to.be.true;

        // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
        const noSuchLeaf = customHash(hash, proof.at(0));

        expect(await this.custommock.processProof(proof.slice(1), noSuchLeaf)).to.equal(root);
        expect(await this.custommock.processProofCalldata(proof.slice(1), noSuchLeaf)).to.equal(root);
        expect(await this.custommock.verify(proof.slice(1), root, noSuchLeaf)).to.be.true;
        expect(await this.custommock.verifyCalldata(proof.slice(1), root, noSuchLeaf)).to.be.true;
      });

      it('returns false for an invalid Merkle proof', async function () {
        const correctMerkleTree = SimpleMerkleTree.of(toBytesElements('abc'), { nodeHash: customHash });
        const otherMerkleTree = SimpleMerkleTree.of(toBytesElements('def'), { nodeHash: customHash });

        const root = correctMerkleTree.root;
        const hash = correctMerkleTree.at(0);
        const proof = otherMerkleTree.getProof(0);

        expect(await this.custommock.processProof(proof, hash)).to.not.equal(root);
        expect(await this.custommock.processProofCalldata(proof, hash)).to.not.equal(root);
        expect(await this.custommock.verify(proof, root, hash)).to.be.false;
        expect(await this.custommock.verifyCalldata(proof, root, hash)).to.be.false;
      });

      it('returns false for a Merkle proof of invalid length', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abc'), { nodeHash: customHash });

        const root = merkleTree.root;
        const hash = merkleTree.at(0);
        const proof = merkleTree.getProof(0);
        const badProof = proof.slice(0, -1);

        expect(await this.custommock.processProof(badProof, hash)).to.not.equal(root);
        expect(await this.custommock.processProofCalldata(badProof, hash)).to.not.equal(root);
        expect(await this.custommock.verify(badProof, root, hash)).to.be.false;
        expect(await this.custommock.verifyCalldata(badProof, root, hash)).to.be.false;
      });
    });

    describe('multiProofVerify', function () {
      it('returns true for a valid Merkle multi proof', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abcdef'), { nodeHash: customHash });

        const root = merkleTree.root;
        const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toBytesElements('bdf'));

        expect(await this.custommock.processMultiProof(proof, proofFlags, leaves)).to.equal(root);
        expect(await this.custommock.processMultiProofCalldata(proof, proofFlags, leaves)).to.equal(root);
        expect(await this.custommock.multiProofVerify(proof, proofFlags, root, leaves)).to.be.true;
        expect(await this.custommock.multiProofVerifyCalldata(proof, proofFlags, root, leaves)).to.be.true;
      });

      it('returns false for an invalid Merkle multi proof', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abcdef'), { nodeHash: customHash });
        const otherMerkleTree = SimpleMerkleTree.of(toBytesElements('ghi'), { nodeHash: customHash });

        const root = merkleTree.root;
        const { proof, proofFlags, leaves } = otherMerkleTree.getMultiProof(toBytesElements('ghi'));

        expect(await this.custommock.processMultiProof(proof, proofFlags, leaves)).to.not.equal(root);
        expect(await this.custommock.processMultiProofCalldata(proof, proofFlags, leaves)).to.not.equal(root);
        expect(await this.custommock.multiProofVerify(proof, proofFlags, root, leaves)).to.be.false;
        expect(await this.custommock.multiProofVerifyCalldata(proof, proofFlags, root, leaves)).to.be.false;
      });

      it('revert with invalid multi proof #1', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abcd'), { nodeHash: customHash });

        const root = merkleTree.root;
        const hashA = merkleTree.at(0);
        const hashB = merkleTree.at(1);
        const hashCD = customHash(merkleTree.at(2), merkleTree.at(3));
        const hashE = ethers.randomBytes(32); // incorrect (not part of the tree)
        const fill = ethers.randomBytes(32);

        await expect(
          this.custommock.processMultiProof([hashB, fill, hashCD], [false, false, false], [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.custommock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.custommock.processMultiProofCalldata([hashB, fill, hashCD], [false, false, false], [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.custommock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.custommock.multiProofVerify([hashB, fill, hashCD], [false, false, false], root, [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.custommock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.custommock.multiProofVerifyCalldata([hashB, fill, hashCD], [false, false, false], root, [hashA, hashE]),
        ).to.be.revertedWithCustomError(this.custommock, 'MerkleProofInvalidMultiproof');
      });

      it('revert with invalid multi proof #2', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abcd'), { nodeHash: customHash });

        const root = merkleTree.root;
        const hashA = merkleTree.at(0);
        const hashB = merkleTree.at(1);
        const hashCD = customHash(merkleTree.at(2), merkleTree.at(3));
        const hashE = ethers.randomBytes(32); // incorrect (not part of the tree)
        const fill = ethers.randomBytes(32);

        await expect(
          this.custommock.processMultiProof([hashB, fill, hashCD], [false, false, false, false], [hashE, hashA]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.custommock.processMultiProofCalldata(
            [hashB, fill, hashCD],
            [false, false, false, false],
            [hashE, hashA],
          ),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.custommock.multiProofVerify([hashB, fill, hashCD], [false, false, false, false], root, [hashE, hashA]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);

        await expect(
          this.custommock.multiProofVerifyCalldata([hashB, fill, hashCD], [false, false, false, false], root, [
            hashE,
            hashA,
          ]),
        ).to.be.revertedWithPanic(PANIC_CODES.ARRAY_ACCESS_OUT_OF_BOUNDS);
      });

      it('limit case: works for tree containing a single leaf', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('a'), { nodeHash: customHash });

        const root = merkleTree.root;
        const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toBytesElements('a'));

        expect(await this.mock.$processMultiProof(proof, proofFlags, leaves)).to.equal(root);
        expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, leaves)).to.equal(root);
        expect(await this.mock.$multiProofVerify(proof, proofFlags, root, leaves)).to.be.true;
        expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, leaves)).to.be.true;
      });

      it('limit case: can prove empty leaves', async function () {
        const merkleTree = SimpleMerkleTree.of(toBytesElements('abcd'), { nodeHash: customHash });

        const root = merkleTree.root;
        expect(await this.mock.$processMultiProof([root], [], [])).to.equal(root);
        expect(await this.mock.$processMultiProofCalldata([root], [], [])).to.equal(root);
        expect(await this.mock.$multiProofVerify([root], [], root, [])).to.be.true;
        expect(await this.mock.$multiProofVerifyCalldata([root], [], root, [])).to.be.true;
      });

      it('reverts processing manipulated proofs with a zero-value node at depth 1', async function () {
        // Create a merkle tree that contains a zero leaf at depth 1
        const leave = ethers.id('real leaf');
        const root = defaultHash(leave, ethers.ZeroHash);

        // Now we can pass any **malicious** fake leaves as valid!
        const maliciousLeaves = ['malicious', 'leaves'].map(ethers.id).map(ethers.toBeArray).sort(Buffer.compare);
        const maliciousProof = [leave, leave];
        const maliciousProofFlags = [true, true, false];

        await expect(
          this.mock.$processMultiProof(maliciousProof, maliciousProofFlags, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$processMultiProofCalldata(maliciousProof, maliciousProofFlags, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$multiProofVerify(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');

        await expect(
          this.mock.$multiProofVerifyCalldata(maliciousProof, maliciousProofFlags, root, maliciousLeaves),
        ).to.be.revertedWithCustomError(this.mock, 'MerkleProofInvalidMultiproof');
      });
    });
  });
});
