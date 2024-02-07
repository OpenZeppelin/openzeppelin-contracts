// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {MerkleProof} from "../cryptography/MerkleProof.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev A complete binary tree with the ability to sequentially insert leaves, changing them from a zero to a non-zero
 * value, while keeping a history of merkle roots. This structure allows inserting commitment (or other entries) that
 * are not stored, but can be proven to be part of the tree.
 *
 * The history of merkle roots allow inclusion proofs to remain valid even if leaves are inserted into the tree between
 *  the moment the proof is generated and the moment it's verified.
 *
 * Each tree can be customized to use specific
 * - depth
 * - length of the root history
 * - zero values (for "empty" leaves)
 * - hash function
 *
 * WARNING: By design, the tree include zero leaves. Customizing the "zero value" might be necessary to ensure that
 * empty leaves being provably part of the tree is not a security issue.
 *
 * _Available since v5.1._
 */
library MerkleTree {
    /**
     * @dev Maximum supported depth. Beyond that, some checks will fail to properly work.
     * This should be enough for any realistic usecase.
     */
    uint256 private constant MAX_DEPTH = 255;

    /**
     * @dev Merkle tree cannot be set-up because requested depth is to large.
     */
    error MerkleTreeInvalidDepth(uint256 depth, uint256 maxDepth);

    /**
     * @dev The `sides` and `zero` arrays are set, at initialization, to have a length equal to the depth of the tree.
     * No push/pop operations should be performed of these array, and their lengths should not be updated.
     *
     * The `roots` array stores the history of roots. Its length is set at initialization, and should not be updated.
     *
     * The hashing function used during initialization to compute the `zeros` values (value of a node at a given depth
     * for which the subtree is full of zero leaves). This function is kept in the structure for handling insertions.
     */
    struct TreeWithHistory {
        uint256 currentRootIndex;
        uint256 nextLeafIndex;
        bytes32[] sides;
        bytes32[] zeros;
        bytes32[] roots;
        function(bytes32, bytes32) view returns (bytes32) fnHash;
    }

    /**
     * @dev Initialize using the default hash
     */
    function setUp(TreeWithHistory storage self, uint256 depth, uint256 length, bytes32 zero) internal {
        return setUp(self, depth, length, zero, MerkleProof.hashPair);
    }

    /**
     * @dev Initialize a new complete MerkleTree defined by:
     * - Depth `depth`
     * - All leaves are initialize to `zero`
     * - Hashing function for a pair of leaves is fnHash
     * and keep a root history of length `length` when leaves are inserted.
     */
    function setUp(
        TreeWithHistory storage self,
        uint256 depth,
        uint256 length,
        bytes32 zero,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal {
        if (depth > MAX_DEPTH) {
            revert MerkleTreeInvalidDepth(depth, MAX_DEPTH);
        }

        // Store depth & length in the dynamic array
        Arrays.unsafeSetLength(self.sides, depth);
        Arrays.unsafeSetLength(self.zeros, depth);
        Arrays.unsafeSetLength(self.roots, length);
        self.fnHash = fnHash;

        // Build the different hashes in a zero-filled complete tree
        bytes32 currentZero = zero;
        for (uint32 i = 0; i < depth; ++i) {
            Arrays.unsafeAccess(self.zeros, i).value = currentZero;
            currentZero = fnHash(currentZero, currentZero);
        }

        // Insert the first root
        Arrays.unsafeAccess(self.roots, 0).value = currentZero;
    }

    /**
     * @dev Insert a new leaf in the tree, compute the new root, and store that new root in the history.
     */
    function insert(TreeWithHistory storage self, bytes32 leaf) internal returns (uint256) {
        // Cache read
        uint256 depth = self.zeros.length;
        function(bytes32, bytes32) view returns (bytes32) fnHash = self.fnHash;

        // Get leaf index
        uint256 leafIndex = self.nextLeafIndex++;

        // Check if tree is full.
        if (leafIndex == 1 << depth) Panic.panic(Panic.RESOURCE_ERROR);

        // Rebuild branch from leaf to root
        uint256 currentIndex = leafIndex;
        bytes32 currentLevelHash = leaf;
        for (uint32 i = 0; i < depth; i++) {
            // Reaching the parent node, is currentLevelHash the left child?
            bool isLeft = currentIndex % 2 == 0;

            // If so, next time we will come from the right, so we need to save it
            if (isLeft) {
                Arrays.unsafeAccess(self.sides, i).value = currentLevelHash;
            }

            // Compute the node hash by hashing the current hash with either:
            // - the last value for this level
            // - the zero for this level
            currentLevelHash = fnHash(
                isLeft ? currentLevelHash : Arrays.unsafeAccess(self.sides, i).value,
                isLeft ? Arrays.unsafeAccess(self.zeros, i).value : currentLevelHash
            );

            // Update node index
            currentIndex >>= 1;
        }

        // Record new root
        self.currentRootIndex = (self.currentRootIndex + 1) % self.roots.length;
        Arrays.unsafeAccess(self.roots, self.currentRootIndex).value = currentLevelHash;

        return leafIndex;
    }

    /**
     * @dev Tree's depth (set at initialization)
     */
    function getDepth(TreeWithHistory storage self) internal view returns (uint256) {
        return self.zeros.length;
    }

    /**
     * @dev History length (set at initialization)
     */
    function getLength(TreeWithHistory storage self) internal view returns (uint256) {
        return self.roots.length;
    }

    /**
     * @dev Return the current root of the tree.
     */
    function getLastRoot(TreeWithHistory storage self) internal view returns (bytes32) {
        return Arrays.unsafeAccess(self.roots, self.currentRootIndex).value;
    }

    /**
     * @dev Look in root history,
     */
    function isKnownRoot(TreeWithHistory storage self, bytes32 root) internal view returns (bool) {
        if (root == 0) {
            return false;
        }

        // Cache read
        uint256 currentRootIndex = self.currentRootIndex;
        uint256 length = self.roots.length;

        // Search (most recents first)
        for (uint256 i = length; i > 0; --i) {
            if (root == Arrays.unsafeAccess(self.roots, (currentRootIndex + i) % length).value) {
                return true;
            }
        }

        return false;
    }
}
