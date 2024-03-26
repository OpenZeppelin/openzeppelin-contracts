// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Hashes} from "../cryptography/Hashes.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";

/**
 * @dev Library for managing https://wikipedia.org/wiki/Merkle_Tree[Merkle Tree] data structures.
 *
 * Each tree is a complete binary tree with the ability to sequentially insert leaves, changing them from a zero to a
 * non-zero value and updating its root. This structure allows inserting commitments (or other entries) that are not
 * stored, but can be proven to be part of the tree at a later time if the root is kept. See {MerkleProof}.
 *
 * A tree is defined by the following parameters:
 *
 * * Depth: The number of levels in the tree, it also defines the maximum number of leaves as 2**depth.
 * * Zero value: The value that represents an empty leaf. Used to avoid regular zero values to be part of the tree.
 * * Hashing function: A cryptographic hash function used to produce internal nodes.
 *
 * _Available since v5.1._
 */
library MerkleTree {
    /**
     * @dev A complete `bytes32` Merkle tree.
     *
     * The `sides` and `zero` arrays are set to have a length equal to the depth of the tree during setup.
     *
     * The hashing function used during initialization to compute the `zeros` values (value of a node at a given depth
     * for which the subtree is full of zero leaves). This function is kept in the structure for handling insertions.
     *
     * Struct members have an underscore prefix indicating that they are "private" and should not be read or written to
     * directly. Use the functions provided below instead. Modifying the struct manually may violate assumptions and
     * lead to unexpected behavior.
     *
     * NOTE: The `root` and the updates history is not stored within the tree. Consider using a secondary structure to
     * store a list of historical roots from the values returned from {setup} and {push} (e.g. a mapping, {BitMaps} or
     * {Checkpoints}).
     *
     * WARNING: Updating any of the tree's parameters after the first insertion will result in a corrupted tree.
     */
    struct Bytes32PushTree {
        uint256 _nextLeafIndex;
        bytes32[] _sides;
        bytes32[] _zeros;
        function(bytes32, bytes32) view returns (bytes32) _fnHash;
    }

    /**
     * @dev Initialize a {Bytes32PushTree} using {Hashes-commutativeKeccak256} to hash internal nodes.
     * The capacity of the tree (i.e. number of leaves) is set to `2**levels`.
     *
     * Calling this function on MerkleTree that was already setup and used will reset it to a blank state.
     *
     * IMPORTANT: The zero value should be carefully chosen since it will be stored in the tree representing
     * empty leaves. It should be a value that is not expected to be part of the tree.
     */
    function setup(Bytes32PushTree storage self, uint8 levels, bytes32 zero) internal returns (bytes32 initialRoot) {
        return setup(self, levels, zero, Hashes.commutativeKeccak256);
    }

    /**
     * @dev Same as {setup}, but allows to specify a custom hashing function.
     *
     * IMPORTANT: Providing a custom hashing function is a security-sensitive operation since it may
     * compromise the soundness of the tree. Consider using functions from {Hashes}.
     */
    function setup(
        Bytes32PushTree storage self,
        uint8 levels,
        bytes32 zero,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal returns (bytes32 initialRoot) {
        // Store depth in the dynamic array
        Arrays.unsafeSetLength(self._sides, levels);
        Arrays.unsafeSetLength(self._zeros, levels);

        // Build each root of zero-filled subtrees
        bytes32 currentZero = zero;
        for (uint32 i = 0; i < levels; ++i) {
            Arrays.unsafeAccess(self._zeros, i).value = currentZero;
            currentZero = fnHash(currentZero, currentZero);
        }

        // Set the first root
        self._nextLeafIndex = 0;
        self._fnHash = fnHash;

        return currentZero;
    }

    /**
     * @dev Insert a new leaf in the tree, and compute the new root. Returns the position of the inserted leaf in the
     * tree, and the resulting root.
     *
     * Hashing the leaf before calling this function is recommended as a protection against
     * second pre-image attacks.
     */
    function push(Bytes32PushTree storage self, bytes32 leaf) internal returns (uint256 index, bytes32 newRoot) {
        // Cache read
        uint256 levels = self._zeros.length;
        function(bytes32, bytes32) view returns (bytes32) fnHash = self._fnHash;

        // Get leaf index
        index = self._nextLeafIndex++;

        // Check if tree is full.
        if (index >= 1 << levels) {
            Panic.panic(Panic.RESOURCE_ERROR);
        }

        // Rebuild branch from leaf to root
        uint256 currentIndex = index;
        bytes32 currentLevelHash = leaf;
        for (uint32 i = 0; i < levels; i++) {
            // Reaching the parent node, is currentLevelHash the left child?
            bool isLeft = currentIndex % 2 == 0;

            // If so, next time we will come from the right, so we need to save it
            if (isLeft) {
                Arrays.unsafeAccess(self._sides, i).value = currentLevelHash;
            }

            // Compute the current node hash by using the hash function
            // with either the its sibling (side) or the zero value for that level.
            currentLevelHash = fnHash(
                isLeft ? currentLevelHash : Arrays.unsafeAccess(self._sides, i).value,
                isLeft ? Arrays.unsafeAccess(self._zeros, i).value : currentLevelHash
            );

            // Update node index
            currentIndex >>= 1;
        }

        return (index, currentLevelHash);
    }

    /**
     * @dev Tree's depth (set at initialization)
     */
    function depth(Bytes32PushTree storage self) internal view returns (uint256) {
        return self._zeros.length;
    }
}
