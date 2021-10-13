// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev These functions deal with verification of Merkle Trees proofs.
 *
 * The proofs can be generated using the JavaScript library
 * https://github.com/miguelmota/merkletreejs[merkletreejs].
 * Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.
 *
 * See `test/utils/cryptography/MerkleProof.test.js` for some examples.
 */
library MerkleProof {
    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree. Each
     * pair of leaves and each pair of pre-images are assumed to be sorted.
     */
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        // Check if the computed hash (root) is equal to the provided root
        (bytes32 computedHash, ) = processProof(proof, leaf);
        return computedHash == root;
    }

    /**
     * @dev Returns the rebuilt hash obtained by traversing a Merklee tree up
     * from `leaf` using `proof`, and an index uniquely identifying the leaf
     * location in the tree. A `proof` is valid if and only if the rebuilt hash
     * matches the root of the tree. When processing the proof, the pairs of
     * leafs & pre-images are assumed to be sorted.
     * The produced index is unique in the sense that processing two valid proofs
     * will return the same indices if and only if the leaf is at the same location
     * in the tree. This helps distinguishing two leaves that have the same
     * bytes32 identifier but are present in different locations in the merkle
     * tree.
     *
     * _Available since v4.4._
     */
    function processProof(bytes32[] memory proof, bytes32 leaf) internal pure returns (bytes32, uint256) {
        bytes32 computedHash = leaf;
        uint256 index = 0;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            index <<= 1;
            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
                index |= 1;
            }
        }
        return (computedHash, index);
    }
}
