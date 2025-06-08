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
    using Math for uint256;
    using Bytes for *;
    using Memory for *;

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
        DATA_ITEM, // Single data value
        LIST_ITEM // List of RLP encoded items
    }

    /**
     * @dev Maximum length for data that will be encoded using the short format.
     * If `data.length <= 55 bytes`, it will be encoded as: `[0x80 + length]` + data.
     */
    uint8 internal constant SHORT_THRESHOLD = 55;

    /// @dev Single byte prefix for short strings (0-55 bytes)
    uint8 internal constant SHORT_OFFSET = 128;
    /// @dev Prefix for long string length (0xB8)
    uint8 internal constant LONG_LENGTH_OFFSET = SHORT_OFFSET + SHORT_THRESHOLD + 1; // 184
    /// @dev Prefix for list items (0xC0)
    uint8 internal constant LONG_OFFSET = LONG_LENGTH_OFFSET + 8; // 192
    /// @dev Prefix for long list length (0xF8)
    uint8 internal constant SHORT_LIST_OFFSET = LONG_OFFSET + SHORT_THRESHOLD + 1; // 248

    /**
     * @dev Encodes a bytes array using RLP rules.
     * Single bytes below 128 are encoded as themselves, otherwise as length prefix + data.
     */
    function encode(bytes memory buffer) internal pure returns (bytes memory) {
        return _isSingleByte(buffer) ? buffer : bytes.concat(_encodeLength(buffer.length, SHORT_OFFSET), buffer);
    }

    /**
     * @dev Encodes an array of bytes using RLP (as a list).
     * First it {_flatten}s the list of byte arrays, then encodes it with the list prefix.
     */
    function encode(bytes[] memory list) internal pure returns (bytes memory) {
        bytes memory flattened = _flatten(list);
        return bytes.concat(_encodeLength(flattened.length, LONG_OFFSET), flattened);
    }

    /// @dev Convenience method to encode a string as RLP.
    function encode(string memory str) internal pure returns (bytes memory) {
        return encode(bytes(str));
    }

    /// @dev Convenience method to encode an address as RLP bytes (i.e. encoded as packed 20 bytes).
    function encode(address addr) internal pure returns (bytes memory) {
        return encode(abi.encodePacked(addr));
    }

    /// @dev Convenience method to encode a uint256 as RLP. See {_binaryBuffer}.
    function encode(uint256 value) internal pure returns (bytes memory) {
        return encode(_binaryBuffer(value));
    }

    /// @dev Same as {encode-uint256-}, but for bytes32.
    function encode(bytes32 value) internal pure returns (bytes memory) {
        return encode(uint256(value));
    }

    /**
     * @dev Convenience method to encode a boolean as RLP.
     *
     * Boolean `true` is encoded as 0x01, `false` as 0x80 (equivalent to encoding integers 1 and 0).
     * This follows the de facto ecosystem standard where booleans are treated as 0/1 integers.
     *
     * NOTE: Both this and {encodeStrict} produce identical encoded bytes at the output level.
     * Use this for ecosystem compatibility; use {encodeStrict} for strict RLP spec compliance.
     */
    function encode(bool value) internal pure returns (bytes memory) {
        return encode(value ? uint256(1) : uint256(0));
    }

    /**
     * @dev Strict RLP encoding of a boolean following literal spec interpretation.
     * Boolean `true` is encoded as 0x01, `false` as empty bytes (0x80).
     *
     * NOTE: This is the strict RLP spec interpretation where false represents "empty".
     * Use this for strict RLP spec compliance; use {encode} for ecosystem compatibility.
     */
    function encodeStrict(bool value) internal pure returns (bytes memory) {
        return value ? abi.encodePacked(bytes1(0x01)) : encode(new bytes(0));
    }

    /// @dev Creates an RLP Item from a bytes array.
    function toItem(bytes memory value) internal pure returns (Item memory) {
        require(value.length != 0, RLPEmptyItem()); // Empty arrays are not RLP items.
        return Item(value.length, value.contentPointer());
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items. See {_decodeLength}
    function readList(Item memory item) internal pure returns (Item[] memory) {
        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.LIST_ITEM, RLPUnexpectedType(ItemType.LIST_ITEM, itemType));
        uint256 expectedLength = listOffset + listLength;
        require(expectedLength == item.length, RLPContentLengthMismatch(expectedLength, item.length));
        Item[] memory items = new Item[](32);

        uint256 itemCount;

        for (uint256 currentOffset = listOffset; currentOffset < item.length; ++itemCount) {
            (uint256 itemOffset, uint256 itemLength, ) = _decodeLength(
                Item(item.length - currentOffset, item.ptr.addOffset(currentOffset))
            );
            items[itemCount] = Item(itemLength + itemOffset, item.ptr.addOffset(currentOffset));
            currentOffset += itemOffset + itemLength;
        }

        // Decrease the array size to match the actual item count.
        assembly ("memory-safe") {
            mstore(items, itemCount)
        }
        return items;
    }

    /// @dev Same as {readList} but for `bytes`. See {toItem}.
    function readList(bytes memory value) internal pure returns (Item[] memory) {
        return readList(toItem(value));
    }

    /// @dev Decodes an RLP encoded item.
    function readBytes(Item memory item) internal pure returns (bytes memory) {
        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.DATA_ITEM, RLPUnexpectedType(ItemType.DATA_ITEM, itemType));
        uint256 expectedLength = itemOffset + itemLength;
        require(expectedLength == item.length, RLPContentLengthMismatch(expectedLength, item.length));

        bytes memory result = new bytes(itemLength);
        result.contentPointer().copy(item.ptr.addOffset(itemOffset), itemLength);

        return result;
    }

    /// @dev Same as {readBytes} but for `bytes`. See {toItem}.
    function readBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(toItem(item));
    }

    /// @dev Reads the raw bytes of an RLP item without decoding the content. Includes prefix bytes.
    function readRawBytes(Item memory item) internal pure returns (bytes memory) {
        uint256 itemLength = item.length;
        bytes memory result = new bytes(itemLength);
        result.contentPointer().copy(item.ptr, itemLength);

        return result;
    }

    /// @dev Checks if a buffer is a single byte below 128 (0x80). Encoded as-is in RLP.
    function _isSingleByte(bytes memory buffer) private pure returns (bool) {
        return buffer.length == 1 && uint8(buffer[0]) < SHORT_OFFSET;
    }

    /**
     * @dev Encodes a length with appropriate RLP prefix.
     *
     * Uses short encoding for lengths <= 55 bytes (i.e. `abi.encodePacked(bytes1(uint8(length) + uint8(offset)))`).
     * Uses long encoding for lengths > 55 bytes See {_encodeLongLength}.
     */
    function _encodeLength(uint256 length, uint256 offset) private pure returns (bytes memory) {
        return
            length <= SHORT_THRESHOLD
                ? abi.encodePacked(bytes1(uint8(length) + uint8(offset)))
                : _encodeLongLength(length, offset);
    }

    /**
     * @dev Encodes a long length value (>55 bytes) with a length-of-length prefix.
     * Format: [prefix + length of the length] + [length in big-endian]
     */
    function _encodeLongLength(uint256 length, uint256 offset) private pure returns (bytes memory) {
        uint256 bytesLength = length.log256() + 1; // Result is floored
        return
            abi.encodePacked(
                bytes1(uint8(bytesLength) + uint8(offset) + SHORT_THRESHOLD),
                length.reverseBitsUint256() // to big-endian
            );
    }

    /// @dev Converts a uint256 to minimal binary representation, removing leading zeros.
    function _binaryBuffer(uint256 value) private pure returns (bytes memory) {
        return abi.encodePacked(value).slice(value.countLeadingZeroes());
    }

    /// @dev Concatenates all byte arrays in the `list` sequentially. Returns a flattened buffer.
    function _flatten(bytes[] memory list) private pure returns (bytes memory) {
        // TODO: Move to Arrays.sol
        bytes memory flattened = new bytes(_totalLength(list));
        Memory.Pointer dataPtr = flattened.contentPointer();
        for (uint256 i = 0; i < list.length; i++) {
            bytes memory item = list[i];
            uint256 length = item.length;
            dataPtr.copy(item.contentPointer(), length);
            dataPtr = dataPtr.addOffset(length);
        }
        return flattened;
    }

    /// @dev Sums up the length of each array in the list.
    function _totalLength(bytes[] memory list) private pure returns (uint256) {
        // TODO: Move to Arrays.sol
        uint256 totalLength;
        for (uint256 i = 0; i < list.length; i++) {
            totalLength += list[i].length;
        }
        return totalLength;
    }

    /**
     * @dev Decodes an RLP `item`'s `length and type from its prefix.
     * Returns the offset, length, and type of the RLP item based on the encoding rules.
     */
    function _decodeLength(Item memory item) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length != 0, RLPEmptyItem());
        uint256 prefix = uint8(item.ptr.extractByte());

        // Single byte below 128
        if (prefix < SHORT_OFFSET) return (0, 1, ItemType.DATA_ITEM);

        // Short string (0-55 bytes)
        if (prefix < LONG_LENGTH_OFFSET) return _decodeShortString(prefix - SHORT_OFFSET, item);

        // Long string (>55 bytes)
        if (prefix < LONG_OFFSET) {
            (offset, length) = _decodeLong(prefix - LONG_LENGTH_OFFSET, item);
            return (offset, length, ItemType.DATA_ITEM);
        }

        // Short list
        if (prefix < SHORT_LIST_OFFSET) return _decodeShortList(prefix - LONG_OFFSET, item);

        // Long list
        (offset, length) = _decodeLong(prefix - SHORT_LIST_OFFSET, item);
        return (offset, length, ItemType.LIST_ITEM);
    }

    /// @dev Decodes a short string (0-55 bytes). The first byte contains the length, and the rest is the payload.
    function _decodeShortString(
        uint256 strLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > strLength, RLPInvalidDataRemainder(strLength, item.length));
        require(strLength != 1 || item.ptr.addOffset(1).extractByte() >= bytes1(SHORT_OFFSET));
        return (1, strLength, ItemType.DATA_ITEM);
    }

    /// @dev Decodes a short list (0-55 bytes). The first byte contains the length of the entire list.
    function _decodeShortList(
        uint256 listLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > listLength, RLPInvalidDataRemainder(listLength, item.length));
        return (1, listLength, ItemType.LIST_ITEM);
    }

    /// @dev Decodes a long string or list (>55 bytes). The first byte indicates the length of the length, followed by the length itself.
    function _decodeLong(uint256 lengthLength, Item memory item) private pure returns (uint256 offset, uint256 length) {
        lengthLength += 1; // 1 byte for the length itself
        require(item.length > lengthLength, RLPInvalidDataRemainder(lengthLength, item.length));
        require(item.ptr.extractByte() != 0x00);

        // Extract the length value from the next bytes
        uint256 len = item.ptr.addOffset(1).extractWord() >> (256 - 8 * lengthLength);
        require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
        uint256 expectedLength = lengthLength + len;
        require(item.length <= expectedLength, RLPContentLengthMismatch(expectedLength, item.length));
        return (lengthLength + 1, len);
    }
}
