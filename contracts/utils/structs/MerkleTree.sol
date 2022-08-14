// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// TODO: replace this import in favor or "../Array.sol" when #3589 is merged
import "../StorageSlot.sol";

error Full();

library MerkleTree {
    uint256 private constant _MAX_DEPTH = 255;

    struct TreeWithHistory {
        uint256 currentRootIndex;
        uint256 nextLeafIndex;
        bytes32[] sides;
        bytes32[] zeros;
        bytes32[] roots;
        function(bytes32, bytes32) view returns (bytes32) fnHash;
    }

    /**
     * @dev Initialize a new complete MerkleTree defined by:
     * - Depth `depth`
     * - All leaves are initialize to `zero`
     * - Hashing function for a pair of leaves is fnHash
     * and keep a root history of length `length` when leaves are inserted.
     */
    function initialize(
        TreeWithHistory storage self,
        uint256 depth,
        uint256 length,
        bytes32 zero,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal {
        require(depth <= _MAX_DEPTH, "MerkleTree: invalid length");

        // Store depth & length in the dynamic array
        _unsafeSetLength(self.sides, depth);
        _unsafeSetLength(self.zeros, depth);
        _unsafeSetLength(self.roots, length);
        self.fnHash = fnHash;

        // Build the different hashes in a zero-filled complete tree
        bytes32 currentZero = zero;
        for (uint32 i = 0; i < depth; ++i) {
            unsafeAccess(self.zeros, i).value = currentZero;
            currentZero = fnHash(currentZero, currentZero);
        }

        // Insert the first root
        unsafeAccess(self.roots, 0).value = currentZero;
    }

    /**
     * @dev Insert a new leaf in the tree, compute the new root, and store that new root in the history.
     */
    function insert(TreeWithHistory storage self, bytes32 leaf) internal returns (uint256) {
        // Cache read
        uint256 depth = self.zeros.length;

        // Get leaf index
        uint256 leafIndex = self.nextLeafIndex++;

        // Check if tree is full.
        if (leafIndex == 1 << depth) revert Full();

        // Rebuild branch from leaf to root
        uint256 currentIndex = leafIndex;
        bytes32 currentLevelHash = leaf;
        for (uint32 i = 0; i < depth; i++) {
            // Reaching the parent node, is currentLevelHash the left child?
            bool isLeft = currentIndex % 2 == 0;

            // If so, next time we will come from the right, so we need to save it
            if (isLeft) {
                unsafeAccess(self.sides, i).value = currentLevelHash;
            }

            // Compute the node hash by hasing the current hash with either:
            // - the last value for this level
            // - the zero for this level
            currentLevelHash = self.fnHash(
                isLeft ? currentLevelHash : unsafeAccess(self.sides, i).value,
                isLeft ? unsafeAccess(self.zeros, i).value : currentLevelHash
            );

            // Update node index
            currentIndex >>= 1;
        }

        // Record new root
        self.currentRootIndex = (self.currentRootIndex + 1) % self.roots.length;
        unsafeAccess(self.roots, self.currentRootIndex).value = currentLevelHash;

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
        return unsafeAccess(self.roots, self.currentRootIndex).value;
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
            if (root == unsafeAccess(self.roots, (currentRootIndex + i) % length).value) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Helper to set the length of an dynamic array. Directly writting to `.length` is forbiden.
     */
    function _unsafeSetLength(bytes32[] storage array, uint256 len) private {
        assembly {
            sstore(array.slot, len)
        }
    }

    // TODO: this is part of PR#3589 (in the Arrays library)
    function unsafeAccess(bytes32[] storage arr, uint256 pos) internal pure returns (StorageSlot.Bytes32Slot storage) {
        bytes32 slot;
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0, arr.slot)
            slot := add(keccak256(0, 0x20), pos)
        }
        return StorageSlot.getBytes32Slot(slot);
    }

    // Default hash
    function initialize(
        TreeWithHistory storage self,
        uint256 depth,
        uint256 length
    ) internal {
        return initialize(self, depth, length, bytes32(0), _hashPair);
    }

    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}
