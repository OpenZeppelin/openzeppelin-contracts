// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/RLP.sol)

pragma solidity ^0.8.26;

import {Math} from "./math/Math.sol";
import {Accumulators} from "./structs/Accumulators.sol";
import {Bytes} from "./Bytes.sol";
import {Memory} from "./Memory.sol";

/**
 * @dev Library for encoding and decoding data in RLP format.
 * Recursive Length Prefix (RLP) is the main encoding method used to serialize objects in Ethereum.
 * It's used for encoding everything from transactions to blocks to Patricia-Merkle tries.
 *
 * Inspired by
 *
 * * https://github.com/succinctlabs/optimism-bedrock-contracts/blob/main/rlp/RLPWriter.sol
 * * https://github.com/succinctlabs/optimism-bedrock-contracts/blob/main/rlp/RLPReader.sol
 *
 * == Canonical vs Non-Canonical Encodings
 *
 * According to the Ethereum Yellow Paper, a "canonical" RLP encoding is the unique, minimal
 * representation of a value. For scalar values (integers), this means:
 *
 * * No leading zero bytes (e.g., `0x0123` should be encoded as 2 bytes, not `0x000123` as 3 bytes)
 * * Single bytes less than 0x80 must be encoded directly without a prefix wrapper
 * * Zero is represented as an empty byte array (prefix `0x80`)
 *
 * A "non-canonical" encoding represents the same value but doesn't follow these minimality rules.
 * For example, encoding the integer 1234 (0x04d2) with a leading zero as `0x830004d2` instead
 * of the canonical `0x8204d2`.
 *
 * [IMPORTANT]
 * ====
 * This implementation takes a permissive approach to decoding, accepting some non-canonical
 * encodings (e.g., scalar values with leading zero bytes) that would be rejected by
 * strict implementations like go-ethereum. This design choice prioritizes compatibility
 * with diverse RLP encoders in the ecosystem over strict adherence to the Yellow Paper
 * specification's canonicalization requirements.
 *
 * Users should be aware that:
 *
 * * Multiple different RLP encodings may decode to the same value (non-injective)
 * * Encoding followed by decoding is guaranteed to work correctly
 * * External RLP data from untrusted sources may have non-canonical encodings
 * * Improperly wrapped single bytes (< 0x80) are still rejected as invalid
 * ====
 */
library RLP {
    using Accumulators for *;
    using Bytes for *;
    using Memory for *;

    /// @dev The item is not properly formatted and cannot de decoded.
    error RLPInvalidEncoding();

    enum ItemType {
        Data, // Single data value
        List // List of RLP encoded items
    }

    /**
     * @dev Maximum length for data that will be encoded using the short format.
     * If `data.length <= 55 bytes`, it will be encoded as: `[0x80 + length]` + data.
     */
    uint8 internal constant SHORT_THRESHOLD = 55;
    /// @dev Single byte prefix for short strings (0-55 bytes)
    uint8 internal constant SHORT_OFFSET = 0x80;
    /// @dev Prefix for list items (0xC0)
    uint8 internal constant LONG_OFFSET = 0xC0;

    /****************************************************************************************************************
     *                                              ENCODING - ENCODER                                              *
     ****************************************************************************************************************/

    struct Encoder {
        Accumulators.Accumulator acc;
    }

    /// @dev Create an empty RLP Encoder.
    function encoder() internal pure returns (Encoder memory enc) {
        enc.acc = Accumulators.accumulator();
    }

    /// @dev Add a boolean to a given RLP Encoder.
    function push(Encoder memory self, bool input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add an address to a given RLP Encoder.
    function push(Encoder memory self, address input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add a uint256 to a given RLP Encoder.
    function push(Encoder memory self, uint256 input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add a bytes32 to a given RLP Encoder.
    function push(Encoder memory self, bytes32 input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add a bytes buffer to a given RLP Encoder.
    function push(Encoder memory self, bytes memory input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add a string to a given RLP Encoder.
    function push(Encoder memory self, string memory input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add an array of bytes to a given RLP Encoder.
    function push(Encoder memory self, bytes[] memory input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /// @dev Add an (input) Encoder to a (target) Encoder. The input is RLP encoded as a list of bytes, and added to the target Encoder.
    function push(Encoder memory self, Encoder memory input) internal pure returns (Encoder memory) {
        self.acc.push(encode(input));
        return self;
    }

    /****************************************************************************************************************
     *                                             ENCODING - TO BYTES                                              *
     ****************************************************************************************************************/

    /**
     * @dev Encode a boolean as RLP.
     *
     * Boolean `true` is encoded as 0x01, `false` as 0x80 (equivalent to encoding integers 1 and 0).
     * This follows the de facto ecosystem standard where booleans are treated as 0/1 integers.
     */
    function encode(bool input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x01) // length of the encoded data: 1 byte
            mstore8(add(result, 0x20), add(mul(iszero(input), 0x7f), 1)) // input
            mstore(0x40, add(result, 0x21)) // reserve memory
        }
    }

    /**
     * @dev Encode an address as an RLP item of fixed size (20 bytes).
     *
     * The address is encoded with its leading zeros (if it has any). If someone wants to encode the address as a scalar,
     * they can cast it to an uint256 and then call the corresponding {encode} function.
     */
    function encode(address input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x15) // length of the encoded data: 1 (prefix) + 0x14 (address)
            mstore(add(result, 0x20), or(shl(248, 0x94), shl(88, input))) // prefix (0x94 = SHORT_OFFSET + 0x14) + input
            mstore(0x40, add(result, 0x35)) // reserve memory
        }
    }

    /**
     * @dev Encode an uint256 as an RLP scalar.
     *
     * Unlike {encode-bytes32-}, this function uses scalar encoding that removes the prefix zeros.
     */
    function encode(uint256 input) internal pure returns (bytes memory result) {
        if (input < SHORT_OFFSET) {
            assembly ("memory-safe") {
                result := mload(0x40)
                mstore(result, 0x01) // length of the encoded data: 1 byte
                mstore8(add(result, 0x20), or(input, mul(0x80, iszero(input)))) // input (zero is encoded as 0x80)
                mstore(0x40, add(result, 0x21)) // reserve memory
            }
        } else {
            uint256 length = Math.log256(input) + 1;
            assembly ("memory-safe") {
                result := mload(0x40)
                mstore(result, add(length, 1)) // length of the encoded data: 1 (prefix) + length
                mstore8(add(result, 0x20), add(length, SHORT_OFFSET)) // prefix: SHORT_OFFSET + length
                mstore(add(result, 0x21), shl(sub(256, mul(8, length)), input)) // input (aligned left)
                mstore(0x40, add(result, add(length, 0x21))) // reserve memory
            }
        }
    }

    /**
     * @dev Encode a bytes32 as an RLP item of fixed size (32 bytes).
     *
     * Unlike {encode-uint256-}, this function uses array encoding that preserves the prefix zeros.
     */
    function encode(bytes32 input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x21) // length of the encoded data: 1 (prefix) + 0x20
            mstore8(add(result, 0x20), 0xa0) // prefix: SHORT_OFFSET + 0x20
            mstore(add(result, 0x21), input)
            mstore(0x40, add(result, 0x41)) // reserve memory
        }
    }

    /// @dev Encode a bytes buffer as RLP.
    function encode(bytes memory input) internal pure returns (bytes memory) {
        return (input.length == 1 && uint8(input[0]) < SHORT_OFFSET) ? input : _encode(input, SHORT_OFFSET);
    }

    /// @dev Encode a string as RLP. Type alias for {encode-bytes-}.
    function encode(string memory input) internal pure returns (bytes memory) {
        return encode(bytes(input));
    }

    /**
     * @dev Encode an array of bytes as RLP.
     * This function expects an array of already encoded bytes, not raw bytes.
     * Users should call {encode} on each element of the array before calling it.
     */
    function encode(bytes[] memory input) internal pure returns (bytes memory) {
        return _encode(input.concat(), LONG_OFFSET);
    }

    /// @dev Encode an encoder (list of bytes) as RLP
    function encode(Encoder memory self) internal pure returns (bytes memory) {
        return _encode(self.acc.flatten(), LONG_OFFSET);
    }

    function _encode(bytes memory input, uint256 offset) private pure returns (bytes memory result) {
        uint256 length = input.length;
        if (length <= SHORT_THRESHOLD) {
            // Encode "short-bytes" as
            // [ offset + input.length | input ]
            assembly ("memory-safe") {
                result := mload(0x40)
                mstore(result, add(length, 1)) // length of the encoded data: 1 (prefix) + input.length
                mstore8(add(result, 0x20), add(length, offset)) // prefix: offset + input.length
                mcopy(add(result, 0x21), add(input, 0x20), length) // input
                mstore(0x40, add(result, add(length, 0x21))) // reserve memory
            }
        } else {
            // Encode "long-bytes" as
            // [ SHORT_THRESHOLD + offset + input.length.length | input.length | input ]
            uint256 lenlength = Math.log256(length) + 1;
            assembly ("memory-safe") {
                result := mload(0x40)
                mstore(result, add(add(length, lenlength), 1)) // length of the encoded data: 1 (prefix) + input.length.length + input.length
                mstore8(add(result, 0x20), add(add(lenlength, offset), SHORT_THRESHOLD)) // prefix: SHORT_THRESHOLD + offset + input.length.length
                mstore(add(result, 0x21), shl(sub(256, mul(8, lenlength)), length)) // input.length
                mcopy(add(result, add(lenlength, 0x21)), add(input, 0x20), length) // input
                mstore(0x40, add(result, add(add(length, lenlength), 0x21))) // reserve memory
            }
        }
    }

    /****************************************************************************************************************
     *                               DECODING - READ FROM AN RLP ENCODED MEMORY SLICE                               *
     ****************************************************************************************************************/

    /**
     * @dev Decode an RLP encoded bool. See {encode-bool}
     *
     * NOTE: This function treats any non-zero value as `true`, which is more permissive
     * than some implementations (e.g., go-ethereum only accepts `0x00` for false and `0x01`
     * for true). For example, `0x02`, `0x03`, etc. will all decode as `true`.
     */
    function readBool(Memory.Slice item) internal pure returns (bool) {
        return readUint256(item) != 0;
    }

    /**
     * @dev Decode an RLP encoded address. See {encode-address}
     *
     * [NOTE]
     * ====
     * This function accepts both single-byte encodings (for values 0-127, including
     * precompile addresses like 0x01) and the standard 21-byte encoding with the `0x94` prefix.
     * For example, `0x01` decodes to `0x0000000000000000000000000000000000000001`.
     *
     * Additionally, like {readUint256}, this function accepts non-canonical encodings with
     * leading zeros. For instance, both `0x01` and `0x940000000000000000000000000000000000000001`
     * decode to the same address.
     * ====
     */
    function readAddress(Memory.Slice item) internal pure returns (address) {
        uint256 length = item.length();
        require(length == 1 || length == 21, RLPInvalidEncoding());
        return address(uint160(readUint256(item)));
    }

    /**
     * @dev Decode an RLP encoded uint256. See {encode-uint256}
     *
     * [NOTE]
     * ====
     * This function accepts non-canonical encodings with leading zero bytes for multi-byte values,
     * which differs from the Ethereum Yellow Paper specification and some reference
     * implementations like go-ethereum. For example, both `0x88ab54a98ceb1f0ad2` and
     * `0x8900ab54a98ceb1f0ad2` will decode to the same uint256 value (12345678901234567890).
     *
     * However, single bytes less than 0x80 must NOT be wrapped with a prefix. For example,
     * `0x8100` is invalid (should be `0x00`), but `0x820000` is valid (two zero bytes).
     *
     * This permissive behavior is intentional for compatibility with various RLP encoders
     * in the ecosystem, but users should be aware that multiple RLP encodings may map
     * to the same decoded value (non-injective decoding).
     * ====
     */
    function readUint256(Memory.Slice item) internal pure returns (uint256) {
        uint256 length = item.length();
        require(length <= 33, RLPInvalidEncoding());

        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPInvalidEncoding());

        return itemLength == 0 ? 0 : uint256(item.load(itemOffset)) >> (256 - 8 * itemLength);
    }

    /**
     * @dev Decode an RLP encoded bytes32. See {encode-bytes32}
     *
     * NOTE: Since this function delegates to {readUint256}, it inherits the non-canonical
     * encoding acceptance behavior for multi-byte values. Multiple RLP encodings with different
     * leading zero bytes may decode to the same bytes32 value, but single bytes < 0x80 must
     * not be wrapped with a prefix (e.g., `0x820000` is valid, but `0x8100` is not).
     */
    function readBytes32(Memory.Slice item) internal pure returns (bytes32) {
        return bytes32(readUint256(item));
    }

    /// @dev Decodes an RLP encoded bytes. See {encode-bytes}
    function readBytes(Memory.Slice item) internal pure returns (bytes memory) {
        (uint256 offset, uint256 length, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPInvalidEncoding());

        // Length is checked by {slice}
        return item.slice(offset, length).toBytes();
    }

    /// @dev Decodes an RLP encoded string. See {encode-string}
    function readString(Memory.Slice item) internal pure returns (string memory) {
        return string(readBytes(item));
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items.
    function readList(Memory.Slice item) internal pure returns (Memory.Slice[] memory list) {
        uint256 itemLength = item.length();

        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.List && itemLength == listOffset + listLength, RLPInvalidEncoding());

        // Start a buffer in the unallocated space
        uint256 ptr;
        assembly ("memory-safe") {
            list := mload(0x40)
            ptr := add(list, 0x20)
        }

        // Get all items in order, and push them to the buffer
        for (uint256 currentOffset = listOffset; currentOffset < itemLength; ptr += 0x20) {
            (uint256 elementOffset, uint256 elementLength, ) = _decodeLength(item.slice(currentOffset));
            Memory.Slice element = item.slice(currentOffset, elementLength + elementOffset);
            currentOffset += elementOffset + elementLength;

            // Write item to the buffer
            assembly ("memory-safe") {
                mstore(ptr, element)
            }
        }

        // write list length and reserve space
        assembly ("memory-safe") {
            mstore(list, div(sub(ptr, add(list, 0x20)), 0x20))
            mstore(0x40, ptr)
        }
    }

    /****************************************************************************************************************
     *                                            DECODING - FROM BYTES                                             *
     ****************************************************************************************************************/

    /// @dev Decode an RLP encoded bool from bytes. See {readBool}
    function decodeBool(bytes memory item) internal pure returns (bool) {
        return readBool(item.asSlice());
    }

    /// @dev Decode an RLP encoded address from bytes. See {readAddress}
    function decodeAddress(bytes memory item) internal pure returns (address) {
        return readAddress(item.asSlice());
    }

    /// @dev Decode an RLP encoded uint256 from bytes. See {readUint256}
    function decodeUint256(bytes memory item) internal pure returns (uint256) {
        return readUint256(item.asSlice());
    }

    /// @dev Decode an RLP encoded bytes32 from bytes. See {readBytes32}
    function decodeBytes32(bytes memory item) internal pure returns (bytes32) {
        return readBytes32(item.asSlice());
    }

    /// @dev Decode an RLP encoded bytes from bytes. See {readBytes}
    function decodeBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(item.asSlice());
    }

    /// @dev Decode an RLP encoded string from bytes. See {readString}
    function decodeString(bytes memory item) internal pure returns (string memory) {
        return readString(item.asSlice());
    }

    /// @dev Decode an RLP encoded list from bytes. See {readList}
    function decodeList(bytes memory value) internal pure returns (Memory.Slice[] memory) {
        return readList(value.asSlice());
    }

    /**
     * @dev Decodes an RLP `item`'s `length and type from its prefix.
     * Returns the offset, length, and type of the RLP item based on the encoding rules.
     */
    function _decodeLength(Memory.Slice item) private pure returns (uint256, uint256, ItemType) {
        uint256 itemLength = item.length();

        require(itemLength != 0, RLPInvalidEncoding());
        uint8 prefix = uint8(bytes1(item.load(0)));

        if (prefix < LONG_OFFSET) {
            // CASE: item
            if (prefix < SHORT_OFFSET) {
                // Case: Single byte below 128
                return (0, 1, ItemType.Data);
            } else if (prefix <= SHORT_OFFSET + SHORT_THRESHOLD) {
                // Case: Short string (0-55 bytes)
                uint256 strLength = prefix - SHORT_OFFSET;
                require(
                    itemLength > strLength && (strLength != 1 || bytes1(item.load(1)) >= bytes1(SHORT_OFFSET)),
                    RLPInvalidEncoding()
                );
                return (1, strLength, ItemType.Data);
            } else {
                // Case: Long string (>55 bytes)
                uint256 lengthLength = prefix - SHORT_OFFSET - SHORT_THRESHOLD;

                bytes32 lenChunk = item.load(1);
                require(itemLength > lengthLength && bytes1(lenChunk) != 0x00, RLPInvalidEncoding());

                uint256 len = uint256(lenChunk) >> (256 - 8 * lengthLength);
                require(len > SHORT_THRESHOLD && itemLength > lengthLength + len, RLPInvalidEncoding());

                return (lengthLength + 1, len, ItemType.Data);
            }
        } else {
            // Case: list
            if (prefix <= LONG_OFFSET + SHORT_THRESHOLD) {
                // Case: Short list
                uint256 listLength = prefix - LONG_OFFSET;
                require(item.length() > listLength, RLPInvalidEncoding());
                return (1, listLength, ItemType.List);
            } else {
                // Case: Long list
                uint256 lengthLength = prefix - LONG_OFFSET - SHORT_THRESHOLD;

                bytes32 lenChunk = item.load(1);
                require(itemLength > lengthLength && bytes1(lenChunk) != 0x00, RLPInvalidEncoding());

                uint256 len = uint256(lenChunk) >> (256 - 8 * lengthLength);
                require(len > SHORT_THRESHOLD && itemLength > lengthLength + len, RLPInvalidEncoding());

                return (lengthLength + 1, len, ItemType.List);
            }
        }
    }
}
