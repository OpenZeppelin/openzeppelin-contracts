const { ethers } = require('hardhat');
const { expect } = require('chai');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { SimpleMerkleTree } = require('@openzeppelin/merkle-tree');

// generate bytes32 leaves from a string
const toLeaves = (str, separator = '') => str.split(separator).map(e => ethers.keccak256(ethers.toUtf8Bytes(e)));
// internal node hashes
const concatSorted = (...elements) => Buffer.concat(elements.map(ethers.getBytes).sort(Buffer.compare));
const defaultHash = (a, b) => ethers.keccak256(concatSorted(a, b));
const customHash = (a, b) => ethers.sha256(concatSorted(a, b));

describe('MerkleProof', function () {
  for (const { title, contractName, nodeHash } of [
    { title: 'default hash', contractName: '$MerkleProof', nodeHash: defaultHash },
    { title: 'custom hash', contractName: '$MerkleProofCustomHashMock', nodeHash: customHash },
  ]) {
    describe(title, function () {
      // stateless: no need for a fixture, just use before
      before(async function () {
        this.mock = await ethers.deployContract(contractName);
        this.makeTree = str => SimpleMerkleTree.of(toLeaves(str), { nodeHash });
      });

      describe('verify', function () {
        it('returns true for a valid Merkle proof', async function () {
          const merkleTree = this.makeTree('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=');

          const root = merkleTree.root;
          const hash = merkleTree.at(0);
          const proof = merkleTree.getProof(0);

          expect(await this.mock.$processProof(proof, hash)).to.equal(root);
          expect(await this.mock.$processProofCalldata(proof, hash)).to.equal(root);
          expect(await this.mock.$verify(proof, root, hash)).to.be.true;
          expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.true;

          // For demonstration, it is also possible to create valid proofs for certain 64-byte values *not* in elements:
          const noSuchLeaf = nodeHash(hash, proof.at(0));

          expect(await this.mock.$processProof(proof.slice(1), noSuchLeaf)).to.equal(root);
          expect(await this.mock.$processProofCalldata(proof.slice(1), noSuchLeaf)).to.equal(root);
          expect(await this.mock.$verify(proof.slice(1), root, noSuchLeaf)).to.be.true;
          expect(await this.mock.$verifyCalldata(proof.slice(1), root, noSuchLeaf)).to.be.true;
        });

        it('returns false for an invalid Merkle proof', async function () {
          const correctMerkleTree = this.makeTree('abc');
          const otherMerkleTree = this.makeTree('def');

          const root = correctMerkleTree.root;
          const hash = correctMerkleTree.at(0);
          const proof = otherMerkleTree.getProof(0);

          expect(await this.mock.$processProof(proof, hash)).to.not.equal(root);
          expect(await this.mock.$processProofCalldata(proof, hash)).to.not.equal(root);
          expect(await this.mock.$verify(proof, root, hash)).to.be.false;
          expect(await this.mock.$verifyCalldata(proof, root, hash)).to.be.false;
        });

        it('returns false for a Merkle proof of invalid length', async function () {
          const merkleTree = this.makeTree('abc');

          const root = merkleTree.root;
          const hash = merkleTree.at(0);
          const proof = merkleTree.getProof(0);
          const badProof = proof.slice(0, -1);

          expect(await this.mock.$processProof(badProof, hash)).to.not.equal(root);
          expect(await this.mock.$processProofCalldata(badProof, hash)).to.not.equal(root);
          expect(await this.mock.$verify(badProof, root, hash)).to.be.false;
          expect(await this.mock.$verifyCalldata(badProof, root, hash)).to.be.false;
        });
      });

      describe('multiProofVerify', function () {
        it('returns true for a valid Merkle multi proof', async function () {
          const merkleTree = this.makeTree('abcdef');

          const root = merkleTree.root;
          const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toLeaves('bdf'));
          const hashes = leaves.map(e => merkleTree.leafHash(e));

          expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.equal(root);
          expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.equal(root);
          expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
          expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
        });

        it('returns false for an invalid Merkle multi proof', async function () {
          const merkleTree = this.makeTree('abcdef');
          const otherMerkleTree = this.makeTree('ghi');

          const root = merkleTree.root;
          const { proof, proofFlags, leaves } = otherMerkleTree.getMultiProof(toLeaves('ghi'));
          const hashes = leaves.map(e => merkleTree.leafHash(e));

          expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.not.equal(root);
          expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.not.equal(root);
          expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.false;
          expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.false;
        });

        it('revert with invalid multi proof #1', async function () {
          const merkleTree = this.makeTree('abcd');

          const root = merkleTree.root;
          const hashA = merkleTree.at(0);
          const hashB = merkleTree.at(1);
          const hashCD = nodeHash(merkleTree.at(2), merkleTree.at(3));
          const hashE = ethers.randomBytes(32); // incorrect (not part of the tree)
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
          const merkleTree = this.makeTree('abcd');

          const root = merkleTree.root;
          const hashA = merkleTree.at(0);
          const hashB = merkleTree.at(1);
          const hashCD = nodeHash(merkleTree.at(2), merkleTree.at(3));
          const hashE = ethers.randomBytes(32); // incorrect (not part of the tree)
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
          const merkleTree = this.makeTree('a');

          const root = merkleTree.root;
          const { proof, proofFlags, leaves } = merkleTree.getMultiProof(toLeaves('a'));
          const hashes = leaves.map(e => merkleTree.leafHash(e));

          expect(await this.mock.$processMultiProof(proof, proofFlags, hashes)).to.equal(root);
          expect(await this.mock.$processMultiProofCalldata(proof, proofFlags, hashes)).to.equal(root);
          expect(await this.mock.$multiProofVerify(proof, proofFlags, root, hashes)).to.be.true;
          expect(await this.mock.$multiProofVerifyCalldata(proof, proofFlags, root, hashes)).to.be.true;
        });

        it('limit case: can prove empty leaves', async function () {
          const merkleTree = this.makeTree('abcd');

          const root = merkleTree.root;
          expect(await this.mock.$processMultiProof([root], [], [])).to.equal(root);
          expect(await this.mock.$processMultiProofCalldata([root], [], [])).to.equal(root);
          expect(await this.mock.$multiProofVerify([root], [], root, [])).to.be.true;
          expect(await this.mock.$multiProofVerifyCalldata([root], [], root, [])).to.be.true;
        });

        it('reverts processing manipulated proofs with a zero-value node at depth 1', async function () {
          // Create a merkle tree that contains a zero leaf at depth 1
          const leave = ethers.id('real leaf');
          const root = nodeHash(leave, ethers.ZeroHash);

          // Now we can pass any **malicious** fake leaves as valid!
          const maliciousLeaves = ['malicious', 'leaves']
            .map(ethers.id)
            .map(id => ethers.toBeArray(id))
            .sort(Buffer.compare);
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
  }
});
