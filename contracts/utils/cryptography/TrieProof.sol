// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Bytes} from "../Bytes.sol";
import {Memory} from "../Memory.sol";
import {RLP} from "../RLP.sol";

/**
 * @dev Library for verifying Ethereum Merkle-Patricia trie inclusion proofs.
 *
 * The {traverse} and {verify} functions can be used to prove the following value:
 *
 * * Transaction against the transactionsRoot of a block.
 * * Event against receiptsRoot of a block.
 * * Account details (RLP encoding of [nonce, balance, storageRoot, codeHash]) against the stateRoot of a block.
 * * Storage slot (RLP encoding of the value) against the storageRoot of a account.
 *
 * Proving a storage slot is usually done in 3 steps:
 *
 * * From the stateRoot of a block, process the account proof (see `eth_getProof`) to get the account details.
 * * RLP decode the account details to extract the storageRoot.
 * * Use storageRoot of that account to process the storageProof (again, see `eth_getProof`).
 *
 * See https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie[Merkle-Patricia trie]
 *
 * Based on https://github.com/ethereum-optimism/optimism/blob/ef970556e668b271a152124023a8d6bb5159bacf/packages/contracts-bedrock/src/libraries/trie/MerkleTrie.sol[this implementation from optimism].
 */
library TrieProof {
    using Bytes for *;
    using RLP for *;
    using Memory for *;

    enum Prefix {
        EXTENSION_EVEN, // 0 - Extension node with even length path
        EXTENSION_ODD, // 1 - Extension node with odd length path
        LEAF_EVEN, // 2 - Leaf node with even length path
        LEAF_ODD // 3 - Leaf node with odd length path
    }

    enum ProofError {
        NO_ERROR, // No error occurred during proof traversal
        EMPTY_KEY, // The provided key is empty
        INVALID_ROOT, // The validation of the root node failed
        INVALID_LARGE_NODE, // The validation of a large node failed
        INVALID_SHORT_NODE, // The validation of a short node failed
        EMPTY_PATH, // The path in a leaf or extension node is empty
        INVALID_PATH_REMAINDER, // The path remainder in a leaf or extension node is invalid
        EMPTY_EXTENSION_PATH_REMAINDER, // The path remainder in an extension node is empty
        INVALID_EXTRA_PROOF_ELEMENT, // A leaf value should be the last proof element
        EMPTY_VALUE, // The leaf value is empty
        MISMATCH_LEAF_PATH_KEY_REMAINDER, // The path remainder in a leaf node doesn't match the key remainder
        UNKNOWN_NODE_PREFIX, // The node prefix is unknown
        UNPARSEABLE_NODE, // The node cannot be parsed from RLP encoding
        INVALID_PROOF // General failure during proof traversal
    }

    error TrieProofTraversalError(ProofError err);

    /// @dev The radix of the Ethereum trie
    uint256 internal constant EVM_TREE_RADIX = 16;

    /// @dev Number of items in a branch node (16 children + 1 value)
    uint256 internal constant BRANCH_NODE_LENGTH = EVM_TREE_RADIX + 1;

    /// @dev Number of items in leaf or extension nodes (always 2)
    uint256 internal constant LEAF_OR_EXTENSION_NODE_LENGTH = 2;

    /// @dev Verifies a `proof` against a given `key`, `value`, `and root` hash.
    function verify(
        bytes memory value,
        bytes32 root,
        bytes memory key,
        bytes[] memory proof
    ) internal pure returns (bool) {
        (bytes memory processedValue, ProofError err) = tryTraverse(root, key, proof);
        return processedValue.equal(value) && err == ProofError.NO_ERROR;
    }

    /**
     * @dev Traverses a proof with a given key and returns the value.
     *
     * Reverts with {TrieProofTraversalError} if proof is invalid.
     */
    function traverse(bytes32 root, bytes memory key, bytes[] memory proof) internal pure returns (bytes memory) {
        (bytes memory value, ProofError err) = tryTraverse(root, key, proof);
        require(err == ProofError.NO_ERROR, TrieProofTraversalError(err));
        return value;
    }

    /**
     * @dev Traverses a proof with a given key and returns the value and an error flag
     * instead of reverting if the proof is invalid. This function may still revert if
     * malformed input leads to RLP decoding errors.
     */
    function tryTraverse(
        bytes32 root,
        bytes memory key,
        bytes[] memory proof
    ) internal pure returns (bytes memory value, ProofError err) {
        if (key.length == 0) return (_emptyBytesMemory(), ProofError.EMPTY_KEY);

        // Expand the key
        bytes memory keyExpanded = key.toNibbles();

        bytes32 currentNodeId;
        uint256 currentNodeIdLength;

        // Free memory pointer cache
        Memory.Pointer fmp = Memory.getFreeMemoryPointer();

        // Traverse proof
        uint256 keyIndex = 0;
        uint256 proofLength = proof.length;
        for (uint256 i = 0; i < proofLength; ++i) {
            // validates the encoded node matches the expected node id
            bytes memory encoded = proof[i];
            if (keyIndex == 0) {
                // Root node must match root hash
                if (keccak256(encoded) != root) return (_emptyBytesMemory(), ProofError.INVALID_ROOT);
            } else if (encoded.length >= 32) {
                // Large nodes are stored as hashes
                if (currentNodeIdLength != 32 || keccak256(encoded) != currentNodeId)
                    return (_emptyBytesMemory(), ProofError.INVALID_LARGE_NODE);
            } else {
                // Small nodes must match directly
                if (currentNodeIdLength != encoded.length || bytes32(encoded) != currentNodeId)
                    return (_emptyBytesMemory(), ProofError.INVALID_SHORT_NODE);
            }

            // decode the current node as an RLP list, and process it
            Memory.Slice[] memory decoded = encoded.decodeList();
            if (decoded.length == BRANCH_NODE_LENGTH) {
                // If we've consumed the entire key, the value must be in the last slot
                // Otherwise, continue down the branch specified by the next nibble in the key
                if (keyIndex == keyExpanded.length) {
                    return _validateLastItem(decoded[EVM_TREE_RADIX], proofLength, i);
                } else {
                    bytes1 branchKey = keyExpanded[keyIndex];
                    (currentNodeId, currentNodeIdLength) = _getNodeId(decoded[uint8(branchKey)]);
                    keyIndex += 1;
                }
            } else if (decoded.length == LEAF_OR_EXTENSION_NODE_LENGTH) {
                bytes memory path = decoded[0].readBytes().toNibbles(); // expanded path
                // The following is equivalent to path.length < 2 because toNibbles can't return odd-length buffers
                if (path.length == 0) {
                    return (_emptyBytesMemory(), ProofError.EMPTY_PATH);
                }
                uint8 prefix = uint8(path[0]);
                Memory.Slice keyRemainder = keyExpanded.asSlice().slice(keyIndex); // Remaining key to match
                Memory.Slice pathRemainder = path.asSlice().slice(2 - (prefix % 2)); // Path after the prefix
                uint256 pathRemainderLength = pathRemainder.length();

                // pathRemainder must not be longer than keyRemainder, and it must be a prefix of it
                if (
                    pathRemainderLength > keyRemainder.length() ||
                    !pathRemainder.equal(keyRemainder.slice(0, pathRemainderLength))
                ) {
                    return (_emptyBytesMemory(), ProofError.INVALID_PATH_REMAINDER);
                }

                if (prefix <= uint8(Prefix.EXTENSION_ODD)) {
                    // Eq to: prefix == EXTENSION_EVEN || prefix == EXTENSION_ODD
                    if (pathRemainderLength == 0) {
                        return (_emptyBytesMemory(), ProofError.EMPTY_EXTENSION_PATH_REMAINDER);
                    }
                    // Increment keyIndex by the number of nibbles consumed and continue traversal
                    (currentNodeId, currentNodeIdLength) = _getNodeId(decoded[1]);
                    keyIndex += pathRemainderLength;
                } else if (prefix <= uint8(Prefix.LEAF_ODD)) {
                    // Eq to: prefix == LEAF_EVEN || prefix == LEAF_ODD
                    //
                    // Leaf node (terminal) - return its value if key matches completely
                    // we already know that pathRemainder is a prefix of keyRemainder, so checking the length sufficient
                    return
                        pathRemainderLength == keyRemainder.length()
                            ? _validateLastItem(decoded[1], proofLength, i)
                            : (_emptyBytesMemory(), ProofError.MISMATCH_LEAF_PATH_KEY_REMAINDER);
                } else {
                    return (_emptyBytesMemory(), ProofError.UNKNOWN_NODE_PREFIX);
                }
            } else {
                return (_emptyBytesMemory(), ProofError.UNPARSEABLE_NODE);
            }

            // Reset memory before next iteration. Deallocates `decoded` and `path`.
            Memory.setFreeMemoryPointer(fmp);
        }

        // If we've gone through all proof elements without finding a value, the proof is invalid
        return (_emptyBytesMemory(), ProofError.INVALID_PROOF);
    }

    /**
     * @dev Validates that we've reached a valid leaf value and this is the last proof element.
     * Ensures the value is not empty and no extra proof elements exist.
     */
    function _validateLastItem(
        Memory.Slice item,
        uint256 trieProofLength,
        uint256 i
    ) private pure returns (bytes memory, ProofError) {
        if (i != trieProofLength - 1) {
            return (_emptyBytesMemory(), ProofError.INVALID_EXTRA_PROOF_ELEMENT);
        }
        bytes memory value = item.readBytes();
        return (value, value.length == 0 ? ProofError.EMPTY_VALUE : ProofError.NO_ERROR);
    }

    /**
     * @dev Extracts the node ID (hash or raw data based on size)
     *
     * For small nodes (encoded length < 32 bytes) the node ID is the node content itself,
     * For larger nodes, the node ID is the hash of the encoded node data.
     *
     * NOTE: Under normal operation, the input should never be exactly 32-byte inputs. If such an input is provided,
     * it will be used directly, similarly to how small nodes are processed. The following traversal check whether
     * the next node is a large one, and whether its hash matches the raw 32 bytes we have here. If that is the case,
     * the value will be accepted. Otherwise, the next step will return an {INVALID_LARGE_NODE} error.
     */
    function _getNodeId(Memory.Slice node) private pure returns (bytes32 nodeId, uint256 nodeIdLength) {
        uint256 nodeLength = node.length();
        return nodeLength < 33 ? (node.load(0), nodeLength) : (node.readBytes32(), 32);
    }

    function _emptyBytesMemory() private pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := 0x60 // mload(0x60) is always 0
        }
    }
}
