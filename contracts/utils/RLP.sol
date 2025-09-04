// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {Bytes} from "./Bytes.sol";
import {Memory} from "./Memory.sol";

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

    struct Item {
        uint256 length; // Total length of the item in bytes
        Memory.Pointer ptr; // Memory pointer to the start of the item
    }

    enum ItemType {
        Data, // Single data value
        List // List of RLP encoded items
    }

    /// @dev Creates an RLP Item from a bytes array.
    function toItem(bytes memory value) internal pure returns (Item memory) {
        require(value.length != 0, RLPEmptyItem()); // Empty arrays are not RLP items.
        return Item(value.length, _addOffset(_asPointer(value), 32));
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items. See {_decodeLength}
    function decodeList(Item memory item) internal pure returns (Item[] memory) {
        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.List, RLPUnexpectedType(ItemType.List, itemType));
        uint256 expectedLength = listOffset + listLength;
        require(expectedLength == item.length, RLPContentLengthMismatch(expectedLength, item.length));
        Item[] memory items = new Item[](32);

        uint256 itemCount;

        for (uint256 currentOffset = listOffset; currentOffset < item.length; ++itemCount) {
            (uint256 itemOffset, uint256 itemLength, ) = _decodeLength(
                Item(item.length - currentOffset, _addOffset(item.ptr, currentOffset))
            );
            items[itemCount] = Item(itemLength + itemOffset, _addOffset(item.ptr, currentOffset));
            currentOffset += itemOffset + itemLength;
        }

        // Decrease the array size to match the actual item count.
        assembly ("memory-safe") {
            mstore(items, itemCount)
        }
        return items;
    }

    /// @dev Same as {decodeList} but for `bytes`. See {toItem}.
    function decodeList(bytes memory value) internal pure returns (Item[] memory) {
        return decodeList(toItem(value));
    }

    /// @dev Decodes an RLP encoded item.
    function decodeBytes(Item memory item) internal pure returns (bytes memory) {
        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPUnexpectedType(ItemType.Data, itemType));
        uint256 expectedLength = itemOffset + itemLength;
        require(expectedLength == item.length, RLPContentLengthMismatch(expectedLength, item.length));

        bytes memory result = new bytes(itemLength);
        _copy(_addOffset(_asPointer(result), 32), _addOffset(item.ptr, itemOffset), itemLength);

        return result;
    }

    /// @dev Same as {decodeBytes} but for `bytes`. See {toItem}.
    function decodeBytes(bytes memory item) internal pure returns (bytes memory) {
        return decodeBytes(toItem(item));
    }

    /// @dev Reads the raw bytes of an RLP item without decoding the content. Includes prefix bytes.
    function decodeRawBytes(Item memory item) internal pure returns (bytes memory) {
        uint256 itemLength = item.length;
        bytes memory result = new bytes(itemLength);
        _copy(_addOffset(_asPointer(result), 32), item.ptr, itemLength);

        return result;
    }

    /**
     * @dev Decodes an RLP `item`'s `length and type from its prefix.
     * Returns the offset, length, and type of the RLP item based on the encoding rules.
     */
    function _decodeLength(Item memory item) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length != 0, RLPEmptyItem());
        uint256 prefix = uint8(_loadByte(item.ptr, 0));

        // Single byte below 128
        if (prefix < SHORT_OFFSET) return (0, 1, ItemType.Data);

        // Short string (0-55 bytes)
        if (prefix < LONG_LENGTH_OFFSET) return _decodeShortString(prefix - SHORT_OFFSET, item);

        // Long string (>55 bytes)
        if (prefix < LONG_OFFSET) {
            (offset, length) = _decodeLong(prefix - LONG_LENGTH_OFFSET, item);
            return (offset, length, ItemType.Data);
        }

        // Short list
        if (prefix < SHORT_LIST_OFFSET) return _decodeShortList(prefix - LONG_OFFSET, item);

        // Long list
        (offset, length) = _decodeLong(prefix - SHORT_LIST_OFFSET, item);
        return (offset, length, ItemType.List);
    }

    /// @dev Decodes a short string (0-55 bytes). The first byte contains the length, and the rest is the payload.
    function _decodeShortString(
        uint256 strLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > strLength, RLPInvalidDataRemainder(strLength, item.length));
        require(strLength != 1 || _loadByte(_addOffset(item.ptr, 1), 0) >= bytes1(SHORT_OFFSET));
        return (1, strLength, ItemType.Data);
    }

    /// @dev Decodes a short list (0-55 bytes). The first byte contains the length of the entire list.
    function _decodeShortList(
        uint256 listLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > listLength, RLPInvalidDataRemainder(listLength, item.length));
        return (1, listLength, ItemType.List);
    }

    /// @dev Decodes a long string or list (>55 bytes). The first byte indicates the length of the length, followed by the length itself.
    function _decodeLong(uint256 lengthLength, Item memory item) private pure returns (uint256 offset, uint256 length) {
        lengthLength += 1; // 1 byte for the length itself
        require(item.length > lengthLength, RLPInvalidDataRemainder(lengthLength, item.length));
        require(_loadByte(item.ptr, 0) != 0x00);

        // Extract the length value from the next bytes
        uint256 len = uint256(_load(_addOffset(item.ptr, 1)) >> (256 - 8 * lengthLength));
        require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
        uint256 expectedLength = lengthLength + len;
        require(item.length <= expectedLength, RLPContentLengthMismatch(expectedLength, item.length));
        return (lengthLength + 1, len);
    }

    function _addOffset(Memory.Pointer ptr, uint256 offset) private pure returns (Memory.Pointer) {
        return bytes32(uint256(ptr.asBytes32()) + offset).asPointer();
    }

    function _copy(Memory.Pointer destPtr, Memory.Pointer srcPtr, uint256 length) private pure {
        assembly ("memory-safe") {
            mcopy(destPtr, srcPtr, length)
        }
    }

    function _loadByte(Memory.Pointer ptr, uint256 offset) private pure returns (bytes1 v) {
        assembly ("memory-safe") {
            v := byte(offset, mload(ptr))
        }
    }

    function _load(Memory.Pointer ptr) private pure returns (bytes32 v) {
        assembly ("memory-safe") {
            v := mload(ptr)
        }
    }

    function _asPointer(bytes memory value) private pure returns (Memory.Pointer ptr) {
        assembly ("memory-safe") {
            ptr := value
        }
    }
}
