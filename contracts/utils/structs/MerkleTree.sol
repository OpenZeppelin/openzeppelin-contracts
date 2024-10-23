// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/structs/MerkleTree.sol)

pragma solidity ^0.8.20;

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
 * * Hashing function: A cryptographic hash function used to produce internal nodes. Defaults to {Hashes-commutativeKeccak256}.
 *
 * NOTE: Building trees using non-commutative hashing functions (i.e. `H(a, b) != H(b, a)`) is supported. However,
 * proving the inclusion of a leaf in such trees is not possible with the {MerkleProof} library since it only supports
 * _commutative_ hashing functions.
 *
 * _Available since v5.1._
 */
library MerkleTree {
    /**
     * @dev A complete `bytes32` Merkle tree.
     *
     * The `sides` and `zero` arrays are set to have a length equal to the depth of the tree during setup.
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
    }

    /**
     * @dev Initialize a {Bytes32PushTree} using {Hashes-commutativeKeccak256} to hash internal nodes.
     * The capacity of the tree (i.e. number of leaves) is set to `2**treeDepth`.
     *
     * Calling this function on MerkleTree that was already setup and used will reset it to a blank state.
     *
     * Once a tree is setup, any push to it must use the same hashing function. This means that values
     * should be pushed to it using the default {xref-MerkleTree-push-struct-MerkleTree-Bytes32PushTree-bytes32-}[push] function.
     *
     * IMPORTANT: The zero value should be carefully chosen since it will be stored in the tree representing
     * empty leaves. It should be a value that is not expected to be part of the tree.
     */
    function setup(Bytes32PushTree storage self, uint8 treeDepth, bytes32 zero) internal returns (bytes32 initialRoot) {
        return setup(self, treeDepth, zero, Hashes.commutativeKeccak256);
    }

    /**
     * @dev Same as {xref-MerkleTree-setup-struct-MerkleTree-Bytes32PushTree-uint8-bytes32-}[setup], but allows to specify a custom hashing function.
     *
     * Once a tree is setup, any push to it must use the same hashing function. This means that values
     * should be pushed to it using the custom push function, which should be the same one as used during the setup.
     *
     * IMPORTANT: Providing a custom hashing function is a security-sensitive operation since it may
     * compromise the soundness of the tree.
     *
     * NOTE: Consider verifying that the hashing function does not manipulate the memory state directly and that it
     * follows the Solidity memory safety rules. Otherwise, it may lead to unexpected behavior.
     */
    function setup(
        Bytes32PushTree storage self,
        uint8 treeDepth,
        bytes32 zero,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal returns (bytes32 initialRoot) {
        // Store depth in the dynamic array
        Arrays.unsafeSetLength(self._sides, treeDepth);
        Arrays.unsafeSetLength(self._zeros, treeDepth);

        // Build each root of zero-filled subtrees
        bytes32 currentZero = zero;
        for (uint32 i = 0; i < treeDepth; ++i) {
            Arrays.unsafeAccess(self._zeros, i).value = currentZero;
            currentZero = fnHash(currentZero, currentZero);
        }

        // Set the first root
        self._nextLeafIndex = 0;

        return currentZero;
    }

    /**
     * @dev Insert a new leaf in the tree, and compute the new root. Returns the position of the inserted leaf in the
     * tree, and the resulting root.
     *
     * Hashing the leaf before calling this function is recommended as a protection against
     * second pre-image attacks.
     *
     * This variant uses {Hashes-commutativeKeccak256} to hash internal nodes. It should only be used on merkle trees
     * that were setup using the same (default) hashing function (i.e. by calling
     * {xref-MerkleTree-setup-struct-MerkleTree-Bytes32PushTree-uint8-bytes32-}[the default setup] function).
     */
    function push(Bytes32PushTree storage self, bytes32 leaf) internal returns (uint256 index, bytes32 newRoot) {
        return push(self, leaf, Hashes.commutativeKeccak256);
    }

    /**
     * @dev Insert a new leaf in the tree, and compute the new root. Returns the position of the inserted leaf in the
     * tree, and the resulting root.
     *
     * Hashing the leaf before calling this function is recommended as a protection against
     * second pre-image attacks.
     *
     * This variant uses a custom hashing function to hash internal nodes. It should only be called with the same
     * function as the one used during the initial setup of the merkle tree.
     */
    function push(
        Bytes32PushTree storage self,
        bytes32 leaf,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal returns (uint256 index, bytes32 newRoot) {
        // Cache read
        uint256 treeDepth = depth(self);

        // Get leaf index
        index = self._nextLeafIndex++;

        // Check if tree is full.
        if (index >= 1 << treeDepth) {
            Panic.panic(Panic.RESOURCE_ERROR);
        }

        // Rebuild branch from leaf to root
        uint256 currentIndex = index;
        bytes32 currentLevelHash = leaf;
        for (uint32 i = 0; i < treeDepth; i++) {
            // Reaching the parent node, is currentLevelHash the left child?
            bool isLeft = currentIndex % 2 == 0;

            // If so, next time we will come from the right, so we need to save it
            if (isLeft) {
                Arrays.unsafeAccess(self._sides, i).value = currentLevelHash;
            }

            // Compute the current node hash by using the hash function
            // with either its sibling (side) or the zero value for that level.
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
