// SPDX-License-Identifier: MIT
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

    /// @dev Encode an address as RLP.
    function encode(address input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x15) // length of the encoded data: 1 (prefix) + 0x14 (address)
            mstore(add(result, 0x20), or(shl(248, 0x94), shl(88, input))) // prefix (0x94 = SHORT_OFFSET + 0x14) + input
            mstore(0x40, add(result, 0x35)) // reserve memory
        }
    }

    /// @dev Encode a uint256 as RLP.
    function encode(uint256 input) internal pure returns (bytes memory result) {
        if (input < SHORT_OFFSET) {
            assembly ("memory-safe") {
                result := mload(0x40)
                mstore(result, 1) // length of the encoded data: 1 byte
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

    /// @dev Encode a bytes32 as RLP. Type alias for {encode-uint256-}.
    function encode(bytes32 input) internal pure returns (bytes memory) {
        return encode(uint256(input));
    }

    /// @dev Encode a bytes buffer as RLP.
    function encode(bytes memory input) internal pure returns (bytes memory) {
        return (input.length == 1 && uint8(input[0]) < SHORT_OFFSET) ? input : _encode(input, SHORT_OFFSET);
    }

    /// @dev Encode a string as RLP. Type alias for {encode-bytes-}.
    function encode(string memory input) internal pure returns (bytes memory) {
        return encode(bytes(input));
    }

    /// @dev Encode an array of bytes as RLP.
    function encode(bytes[] memory input) internal pure returns (bytes memory) {
        return _encode(input.concat(), LONG_OFFSET);
    }

    /// @dev Encode an encoder (list of bytes) as RLP
    function encode(Encoder memory self) internal pure returns (bytes memory result) {
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

    /// @dev Decode an RLP encoded bool. See {encode-bool}
    function readBool(Memory.Slice item) internal pure returns (bool) {
        return readUint256(item) != 0;
    }

    /// @dev Decode an RLP encoded address. See {encode-address}
    function readAddress(Memory.Slice item) internal pure returns (address) {
        uint256 length = item.length();
        require(length == 1 || length == 21, RLPInvalidEncoding());
        return address(uint160(readUint256(item)));
    }

    /// @dev Decode an RLP encoded uint256. See {encode-uint256}
    function readUint256(Memory.Slice item) internal pure returns (uint256) {
        uint256 length = item.length();
        require(length <= 33, RLPInvalidEncoding());

        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPInvalidEncoding());

        return itemLength == 0 ? 0 : uint256(item.load(itemOffset)) >> (256 - 8 * itemLength);
    }

    /// @dev Decode an RLP encoded bytes32. See {encode-bytes32}
    function readBytes32(Memory.Slice item) internal pure returns (bytes32) {
        return bytes32(readUint256(item));
    }

    /// @dev Decodes an RLP encoded bytes. See {encode-bytes}
    function readBytes(Memory.Slice item) internal pure returns (bytes memory) {
        (uint256 offset, uint256 length, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPInvalidEncoding());

        // Length is checked by {toBytes}
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
    function _decodeLength(
        Memory.Slice item
    ) private pure returns (uint256 _offset, uint256 _length, ItemType _itemtype) {
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

                require(itemLength > lengthLength && bytes1(item.load(0)) != 0x00, RLPInvalidEncoding());

                uint256 len = uint256(item.load(1)) >> (256 - 8 * lengthLength);
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

                require(itemLength > lengthLength, RLPInvalidEncoding());
                require(bytes1(item.load(0)) != 0x00);

                uint256 len = uint256(item.load(1)) >> (256 - 8 * lengthLength);
                require(len > SHORT_THRESHOLD && itemLength > lengthLength + len, RLPInvalidEncoding());

                return (lengthLength + 1, len, ItemType.List);
            }
        }
    }
}
