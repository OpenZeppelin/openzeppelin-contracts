// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {Bytes} from "./Bytes.sol";
import {Memory} from "./Memory.sol";
import {Panic} from "./Panic.sol";

/**
 * @dev Library for encoding and decoding data in RLP format.
 * Recursive Length Prefix (RLP) is the main encoding method used to serialize objects in Ethereum.
 * It's used for encoding everything from transactions to blocks to Patricia-Merkle tries.
 */
library RLP {
    using Memory for *;

    /**
     * @dev Maximum length for data that will be encoded using the short format.
     * If `data.length <= 55 bytes`, it will be encoded as: `[0x80 + length]` + data.
     */
    uint8 internal constant SHORT_THRESHOLD = 55;
    /// @dev Single byte prefix for short strings (0-55 bytes)
    uint8 internal constant SHORT_OFFSET = 0x80;
    /// @dev Prefix for list items (0xC0)
    uint8 internal constant LONG_OFFSET = 0xC0;

    /// @dev Prefix for long string length (0xB8)
    uint8 internal constant LONG_LENGTH_OFFSET = SHORT_OFFSET + SHORT_THRESHOLD + 1; // 184
    /// @dev Prefix for long list length (0xF8)
    uint8 internal constant SHORT_LIST_OFFSET = LONG_OFFSET + SHORT_THRESHOLD + 1; // 248

    /****************************************************************************************************************
     *                                                   ENCODING                                                   *
     ****************************************************************************************************************/

    /**
     * @dev Convenience method to encode a boolean as RLP.
     *
     * Boolean `true` is encoded as 0x01, `false` as 0x80 (equivalent to encoding integers 1 and 0).
     * This follows the de facto ecosystem standard where booleans are treated as 0/1 integers.
     */
    function encode(bool input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x01) // length of the encoded data: 1 byte
            mstore8(add(result, 0x20), shl(mul(7, iszero(input)), 1)) // input
            mstore(0x40, add(result, 0x21)) // reserve memory
        }
    }

    /// @dev Convenience method to encode an address as RLP bytes (i.e. encoded as packed 20 bytes).
    function encode(address input) internal pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, 0x15) // length of the encoded data: 1 (prefix) + 14 (address)
            mstore(add(result, 0x20), or(shl(248, 0x94), shl(88, input))) // prefix (0x94 = SHORT_OFFSET + 14) + input
            mstore(0x40, add(result, 0x35)) // reserve memory
        }
    }

    /// @dev Convenience method to encode a uint256 as RLP.
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

    /// @dev Same as {encode-uint256-}, but for bytes32.
    function encode(bytes32 input) internal pure returns (bytes memory) {
        return encode(uint256(input));
    }

    /**
     * @dev Encodes a bytes array using RLP rules.
     * Single bytes below 128 are encoded as themselves, otherwise as length prefix + data.
     */
    function encode(bytes memory input) internal pure returns (bytes memory) {
        return (input.length == 1 && uint8(input[0]) < SHORT_OFFSET) ? input : _encode(input, SHORT_OFFSET);
    }

    /// @dev Convenience method to encode a string as RLP.
    function encode(string memory str) internal pure returns (bytes memory) {
        return encode(bytes(str));
    }

    /**
     * @dev Encodes an array of bytes using RLP (as a list).
     * First it {Bytes-concat}s the list of encoded items, then encodes it with the list prefix.
     */
    function encode(bytes[] memory input) internal pure returns (bytes memory) {
        return _encode(Bytes.concat(input), LONG_OFFSET);
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
     *                                                   DECODING                                                   *
     ****************************************************************************************************************/

    /// @dev Items with length 0 are not RLP items.
    error RLPEmptyItem();

    /// @dev The `item` is not of the `expected` type.
    error RLPUnexpectedType(ItemType expected, ItemType actual);

    /// @dev The item is not long enough to contain the data.
    error RLPInvalidDataRemainder(uint256 minLength, uint256 actualLength);

    /// @dev The content length does not match the expected length.
    error RLPContentLengthMismatch(uint256 expectedLength, uint256 actualLength);

    // Memory slice (equivalent of a calldata slice in memory)
    struct Decoder {
        uint256 length; // Total length of the item in bytes
        Memory.Pointer ptr; // Memory pointer to the start of the item
    }

    enum ItemType {
        Data, // Single data value
        List // List of RLP encoded items
    }

    function decoder(bytes memory self) internal pure returns (Decoder memory result) {
        require(self.length != 0, RLPEmptyItem()); // Empty arrays are not RLP items.

        assembly ("memory-safe") {
            mstore(result, mload(self))
            mstore(add(result, 0x20), add(self, 0x20))
        }
    }

    function _toBytes(Decoder memory self) private pure returns (bytes memory result) {
        return _toBytes(self, 0, self.length);
    }

    function _toBytes(Decoder memory self, uint256 offset, uint256 length) private pure returns (bytes memory result) {
        // TODO: do we want to emit RLPContentLengthMismatch instead?
        // Do we want to check equality?
        if (self.length < offset + length) Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);

        Memory.Pointer ptr = self.ptr;
        assembly ("memory-safe") {
            result := mload(0x40)
            mstore(result, length)
            mcopy(add(result, 0x20), add(ptr, offset), length)
            mstore(0x40, add(result, add(0x20, length)))
        }
    }

    /// @dev Reads the raw bytes of an RLP item without decoding the content. Includes prefix bytes.
    // TODO: is there a usecase for that?
    function readRawBytes(Decoder memory item) internal pure returns (bytes memory) {
        return _toBytes(item);
    }

    /// @dev Decodes an RLP encoded item.
    function readBytes(Decoder memory item) internal pure returns (bytes memory) {
        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPUnexpectedType(ItemType.Data, itemType));

        // Length is checked by {toBytes}
        return _toBytes(item, itemOffset, itemLength);
    }

    function readList(Decoder memory item) internal pure returns (Decoder[] memory) {
        return readList(item, 32);
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items. See {_decodeLength}
    function readList(Decoder memory item, uint256 maxListLength) internal pure returns (Decoder[] memory) {
        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.List, RLPUnexpectedType(ItemType.List, itemType));
        require(item.length == listOffset + listLength, RLPContentLengthMismatch(listOffset + listLength, item.length));

        Decoder[] memory list = new Decoder[](maxListLength);

        uint256 itemCount;
        for (uint256 currentOffset = listOffset; currentOffset < item.length; ++itemCount) {
            (uint256 itemOffset, uint256 itemLength, ) = _decodeLength(
                Decoder(item.length - currentOffset, _addOffset(item.ptr, currentOffset))
            );
            list[itemCount] = Decoder(itemLength + itemOffset, _addOffset(item.ptr, currentOffset));
            currentOffset += itemOffset + itemLength;
        }

        // Decrease the array size to match the actual item count.
        assembly ("memory-safe") {
            mstore(list, itemCount)
        }
        return list;
    }

    /// @dev Same as {decodeBytes} but for `bytes`. See {decode}.
    function decodeBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(decoder(item));
    }

    /// @dev Same as {decodeList} but for `bytes`. See {decode}.
    function decodeList(bytes memory value) internal pure returns (Decoder[] memory) {
        return readList(decoder(value));
    }

    /**
     * @dev Decodes an RLP `item`'s `length and type from its prefix.
     * Returns the offset, length, and type of the RLP item based on the encoding rules.
     */
    function _decodeLength(Decoder memory item) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length != 0, RLPEmptyItem());
        uint8 prefix = uint8(bytes1(_load(item.ptr, 0)));

        if (prefix < SHORT_OFFSET) {
            // Case: Single byte below 128
            return (0, 1, ItemType.Data);
        } else if (prefix < LONG_LENGTH_OFFSET) {
            // Case: Short string (0-55 bytes)
            uint256 strLength = prefix - SHORT_OFFSET;
            require(item.length > strLength, RLPInvalidDataRemainder(strLength, item.length));
            if (strLength == 1) {
                require(bytes1(_load(item.ptr, 1)) >= bytes1(SHORT_OFFSET));
            }
            return (1, strLength, ItemType.Data);
        } else if (prefix < LONG_OFFSET) {
            // Case: Long string (>55 bytes)
            uint256 lengthLength = prefix - 0xb7;

            require(item.length > lengthLength, RLPInvalidDataRemainder(lengthLength, item.length));
            require(bytes1(_load(item.ptr, 0)) != 0x00);

            uint256 len = uint256(_load(item.ptr, 1)) >> (256 - 8 * lengthLength);
            require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
            require(item.length > lengthLength + len, RLPContentLengthMismatch(lengthLength + len, item.length));

            return (lengthLength + 1, len, ItemType.Data);
        } else if (prefix < SHORT_LIST_OFFSET) {
            // Case: Short list
            uint256 listLength = prefix - LONG_OFFSET;
            require(item.length > listLength, RLPInvalidDataRemainder(listLength, item.length));
            return (1, listLength, ItemType.List);
        } else {
            // Case: Long list
            uint256 lengthLength = prefix - 0xf7;

            require(item.length > lengthLength, RLPInvalidDataRemainder(lengthLength, item.length));
            require(bytes1(_load(item.ptr, 0)) != 0x00);

            uint256 len = uint256(_load(item.ptr, 1)) >> (256 - 8 * lengthLength);
            require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
            require(item.length > lengthLength + len, RLPContentLengthMismatch(lengthLength + len, item.length));

            return (lengthLength + 1, len, ItemType.List);
        }
    }

    function _addOffset(Memory.Pointer ptr, uint256 offset) private pure returns (Memory.Pointer) {
        return bytes32(uint256(ptr.asBytes32()) + offset).asPointer();
    }

    function _load(Memory.Pointer ptr, uint256 offset) private pure returns (bytes32 v) {
        assembly ("memory-safe") {
            v := mload(add(ptr, offset))
        }
    }
}
