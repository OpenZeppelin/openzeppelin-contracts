// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "../math/Math.sol";
import {Memory} from "../Memory.sol";
import {RLP} from "../RLP.sol";

/**
 * @dev Library for verifying Ethereum Merkle-Patricia trie inclusion proofs.
 *
 * Ethereum's State Trie state layout is a 4-item array of `[nonce, balance, storageRoot, codeHash]`
 * See https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie[Merkle-Patricia trie]
 */
library TrieProof {
    using RLP for *;
    using Memory for *;

    enum Prefix {
        EXTENSION_EVEN, // 0 - Extension node with even length path
        EXTENSION_ODD, // 1 - Extension node with odd length path
        LEAF_EVEN, // 2 - Leaf node with even length path
        LEAF_ODD // 3 - Leaf node with odd length path
    }

    enum ProofError {
        NO_ERROR, // No error occurred during proof verification
        EMPTY_KEY, // The provided key is empty
        INDEX_OUT_OF_BOUNDS, // Array index access is out of bounds
        INVALID_ROOT_HASH, // The provided root hash doesn't match the proof
        INVALID_LARGE_INTERNAL_HASH, // Internal node hash exceeds expected size
        INVALID_INTERNAL_NODE_HASH, // Internal node hash doesn't match expected value
        EMPTY_VALUE, // The value to verify is empty
        TOO_LARGE_VALUE, // The value to verify is too large
        INVALID_EXTRA_PROOF_ELEMENT, // Proof contains unexpected additional elements
        MISMATCH_LEAF_PATH_KEY_REMAINDERS, // Leaf path remainder doesn't match key remainder
        INVALID_PATH_REMAINDER, // Path remainder doesn't match expected value
        INVALID_KEY_REMAINDER, // Key remainder doesn't match expected value
        UNKNOWN_NODE_PREFIX, // Node prefix is not recognized
        UNPARSEABLE_NODE, // Node cannot be parsed from RLP encoding
        INVALID_PROOF // General proof validation failure
    }

    struct Node {
        bytes encoded; // Raw RLP encoded node
        Memory.Slice[] decoded; // Decoded RLP items
    }

    /// @dev The radix of the Ethereum trie (hexadecimal = 16)
    uint256 internal constant EVM_TREE_RADIX = 16;

    /// @dev Number of items in leaf or extension nodes (always 2)
    uint256 internal constant LEAF_OR_EXTENSION_NODE_LENGTH = 2;

    /// @dev Verifies a `proof` against a given `key`, `value`, `and root` hash.
    function verify(bytes memory key, bytes32 value, bytes[] memory proof, bytes32 root) internal pure returns (bool) {
        (bytes32 processedValue, ProofError err) = processProof(key, proof, root);
        return processedValue == value && err == ProofError.NO_ERROR;
    }

    /// @dev Processes a proof for a given key and returns the processed value.
    function processProof(
        bytes memory key,
        bytes[] memory proof,
        bytes32 root
    ) internal pure returns (bytes32 value, ProofError err) {
        if (key.length == 0) return (bytes32(0), ProofError.EMPTY_KEY);

        // Expand the key
        bytes memory keyExpanded = _nibbles(key);

        // Free memory pointer cache
        Memory.Pointer fmp = Memory.getFreeMemoryPointer();

        // Process proof
        uint256 keyIndex = 0;
        for (uint256 i = 0; i < proof.length; ++i) {
            Node memory node = Node(proof[i], proof[i].decodeList());

            // ensure we haven't overshot the key
            if (keyIndex > keyExpanded.length) {
                return (bytes32(0), ProofError.INDEX_OUT_OF_BOUNDS);
            }

            // validates the node hashes at different levels of the proof.
            if (keyIndex == 0) {
                // Root node must match root hash
                if (keccak256(node.encoded) != root) return (bytes32(0), ProofError.INVALID_ROOT_HASH);
            } else if (node.encoded.length >= 32) {
                // Large nodes are stored as hashes
                if (keccak256(node.encoded) != root) return (bytes32(0), ProofError.INVALID_LARGE_INTERNAL_HASH);
            } else {
                // Small nodes must match directly
                if (bytes32(node.encoded) != root) return (bytes32(0), ProofError.INVALID_INTERNAL_NODE_HASH);
            }

            uint256 nodeLength = node.decoded.length;
            if (nodeLength == EVM_TREE_RADIX + 1) {
                // If we've consumed the entire key, the value must be in the last slot
                // Otherwise, continue down the branch specified by the next nibble in the key
                if (keyIndex == keyExpanded.length) {
                    return _validateLastItem(node.decoded[EVM_TREE_RADIX], proof.length, i);
                } else {
                    root = _getNodeId(node.decoded[uint8(keyExpanded[keyIndex])]);
                    keyIndex += 1;
                }
            } else if (nodeLength == LEAF_OR_EXTENSION_NODE_LENGTH) {
                bytes memory path = _nibbles(node.decoded[0].readBytes());
                uint8 prefix = uint8(path[0]);
                Memory.Slice pathRemainder = path.asSlice().slice(2 - (prefix % 2)); // Path after the prefix
                Memory.Slice keyRemainder = keyExpanded.asSlice().slice(keyIndex); // Remaining key to match

                if (prefix == uint8(Prefix.EXTENSION_EVEN) || prefix == uint8(Prefix.EXTENSION_ODD)) {
                    // Extension node (non-terminal) - validate shared path & continue to next node
                    uint256 shared = _commonPrefixLength(pathRemainder, keyRemainder);

                    // Path must match at least partially with our key
                    if (shared == 0) return (bytes32(0), ProofError.INVALID_PATH_REMAINDER);

                    // Increment keyIndex by the number of nibbles consumed and continue traversal
                    root = _getNodeId(node.decoded[1]);
                    keyIndex += shared;
                } else if (prefix == uint8(Prefix.LEAF_EVEN) || prefix == uint8(Prefix.LEAF_ODD)) {
                    // Leaf node (terminal) - return its value if key matches completely
                    if (pathRemainder.getHash() != keyRemainder.getHash()) {
                        return (bytes32(0), ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDERS);
                    } else if (keyRemainder.length() == 0) {
                        return (bytes32(0), ProofError.INVALID_KEY_REMAINDER);
                    } else {
                        return _validateLastItem(node.decoded[1], proof.length, i);
                    }
                } else {
                    return (bytes32(0), ProofError.UNKNOWN_NODE_PREFIX);
                }
            } else {
                return (bytes32(0), ProofError.UNPARSEABLE_NODE);
            }

            // Reset memory before next iteration. Deallocates `node` and `path`.
            Memory.setFreeMemoryPointer(fmp);
        }

        // If we've gone through all proof elements without finding a value, the proof is invalid
        return (bytes32(0), ProofError.INVALID_PROOF);
    }

    /**
     * @dev Validates that we've reached a valid leaf value and this is the last proof element.
     * Ensures the value is not empty and no extra proof elements exist.
     */
    function _validateLastItem(
        Memory.Slice item,
        uint256 trieProofLength,
        uint256 i
    ) private pure returns (bytes32, ProofError) {
        bytes memory value = item.readBytes();
        if (i != trieProofLength - 1) {
            return (bytes32(0), ProofError.INVALID_EXTRA_PROOF_ELEMENT);
        } else if (value.length == 0) {
            return (bytes32(0), ProofError.EMPTY_VALUE);
        } else if (value.length > 32) {
            return (bytes32(0), ProofError.TOO_LARGE_VALUE);
        } else {
            return (bytes32(value), ProofError.NO_ERROR);
        }
    }

    /**
     * @dev Extracts the node ID (hash or raw data based on size).
     * For small nodes (<=32 bytes), returns the raw bytes; for large nodes, returns the hash.
     */
    function _getNodeId(Memory.Slice node) private pure returns (bytes32) {
        // TODO: for some values of length, we should use `node.readBytesHash()`
        // The "long" case is currently not covered by tests
        return node.readLength() <= 32 ? node.readBytes32() : node.readBytesHash();
    }

    /**
     * @dev Calculates the length of the longest common prefix between two memory slices.
     * Used to determine how much of a path matches a key during trie traversal.
     */
    function _commonPrefixLength(Memory.Slice a, Memory.Slice b) private pure returns (uint256) {
        uint256 length = Math.min(a.length(), b.length());
        for (uint256 i; i < length; i += 32) {
            bytes32 chunk = a.load(i) ^ b.load(i);
            if (chunk != bytes32(0)) {
                return Math.min(length, i + Math.clz(uint256(chunk)) / 8);
            }
        }
        return length;
    }

    /// @dev Split each byte in `value` into two nibbles (4 bits each).
    function _nibbles(bytes memory value) private pure returns (bytes memory) {
        uint256 length = value.length;
        bytes memory nibbles_ = new bytes(length * 2);
        for (uint256 i = 0; i < length; i++) {
            (nibbles_[i * 2], nibbles_[i * 2 + 1]) = ((value[i] & 0xf0) >> 4, value[i] & 0x0f);
        }
        return nibbles_;
    }
}
