// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

error Full();

library MerkleTree {
    uint8 private constant MAX_DEPTH = 32;

    struct TreeWithHistory {
        function(bytes32, bytes32) view returns (bytes32) fnHash;
        uint32 depth;
        uint32 length;
        uint32 currentRootIndex;
        uint32 nextLeafIndex;
        bytes32[MAX_DEPTH] filledSubtrees;
        bytes32[MAX_DEPTH] zeros;
        bytes32[2**MAX_DEPTH] roots;
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
        uint32 depth,
        uint32 length,
        bytes32 zero,
        function(bytes32, bytes32) view returns (bytes32) fnHash
    ) internal {
        require(depth <= MAX_DEPTH);

        self.depth = depth;
        self.length = length;
        self.fnHash = fnHash;

        bytes32 currentZero = zero;
        for (uint32 i = 0; i < depth; ++i) {
            self.zeros[i] = self.filledSubtrees[i] = currentZero;
            currentZero = fnHash(currentZero, currentZero);
        }

        // Insert the first root
        self.roots[0] = currentZero;
    }

    /**
     * @dev Insert a new leaf in the tree, compute the new root, and store that new root in the history.
     *
     * For depth < 32, reverts if the MerkleTree is already full.
     * For depth = 32, reverts when trying to populate the last leaf (nextLeafIndex increment overflow).
     *
     * Said differently:
     * `2 ** depth` entries can be inserted into trees with depth < 32.
     * `2 ** depth - 1` entries can be inserted into trees with depth = 32.
     */
    function insert(TreeWithHistory storage self, bytes32 leaf) internal returns (uint32) {
        // cache read
        uint32 depth = self.depth;

        // Get leaf index
        uint32 leafIndex = self.nextLeafIndex++;

        // Check if tree is full.
        if (leafIndex == 1 << depth) revert Full();

        // Rebuild branch from leaf to root
        uint32 currentIndex = leafIndex;
        bytes32 currentLevelHash = leaf;
        for (uint32 i = 0; i < depth; i++) {
            // Reaching the parent node, is currentLevelHash the left child?
            bool isLeft = currentIndex % 2 == 0;

            // If so, next time we will come from the right, so we need to save it
            if (isLeft) {
                self.filledSubtrees[i] = currentLevelHash;
            }

            // Compute the node hash by hasing the current hash with either:
            // - the last value for this level
            // - the zero for this level
            currentLevelHash = self.fnHash(
                isLeft ? currentLevelHash : self.filledSubtrees[i],
                isLeft ? self.zeros[i] : currentLevelHash
            );

            // update node index
            currentIndex >>= 1;
        }

        // Record new root
        self.currentRootIndex = (self.currentRootIndex + 1) % self.length;
        self.roots[self.currentRootIndex] = currentLevelHash;

        return leafIndex;
    }

    /**
     * @dev Return the current root of the tree.
     */
    function getLastRoot(TreeWithHistory storage self) internal view returns (bytes32) {
        return self.roots[self.currentRootIndex];
    }

    /**
     * @dev Look in root history,
     */
    function isKnownRoot(TreeWithHistory storage self, bytes32 root) internal view returns (bool) {
        if (root == 0) {
            return false;
        }

        // cache as uint256 (avoid overflow)
        uint256 currentRootIndex = self.currentRootIndex;
        uint256 length = self.length;

        // search
        for (uint256 i = length; i > 0; --i) {
            if (root == self.roots[(currentRootIndex + i) % length]) {
                return true;
            }
        }

        return false;
    }

    // Default hash
    function initialize(
        TreeWithHistory storage self,
        uint32 depth,
        uint32 length
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
