// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {Bytes} from "./Bytes.sol";

/**
 * @dev Library for encoding and decoding data in RLP format.
 * Recursive Length Prefix (RLP) is the main encoding method used to serialize objects in Ethereum.
 * It's used for encoding everything from transactions to blocks to Patricia-Merkle tries.
 */
library RLP {
    using Math for uint256;
    using Bytes for *;

    struct Item {
        uint256 length; // Total length of the item in bytes
        bytes32 ptr; // Memory pointer to the start of the item
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
     * Boolean `true` is encoded as single byte 0x01, false as an empty string (0x80).
     */
    function encode(bool value) internal pure returns (bytes memory) {
        bytes memory encoded = new bytes(1);
        encoded[0] = value ? bytes1(0x01) : bytes1(SHORT_OFFSET); // false is encoded as an empty string
        return encoded;
    }

    /// @dev Creates an RLP Item from a bytes array.
    function toItem(bytes memory value) internal pure returns (Item memory) {
        require(value.length != 0); // Empty arrays are not RLP items.
        return Item(value.length, _skippedLengthPtr(value));
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items. See {_decodeLength}
    function readList(Item memory item) internal pure returns (Item[] memory) {
        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.LIST_ITEM);
        require(listOffset + listLength == item.length);
        Item[] memory items = new Item[](32);

        uint256 itemCount = item.length;

        for (uint256 i; listOffset < itemCount; i++) {
            (uint256 itemOffset, uint256 itemLength, ) = _decodeLength(
                Item(itemCount - listOffset, bytes32(uint256(item.ptr) + listOffset))
            );
            items[i] = Item(itemLength + itemOffset, bytes32(uint256(item.ptr) + listOffset));
            listOffset += itemOffset + itemLength;
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
        require(itemType == ItemType.DATA_ITEM);
        require(item.length == itemOffset + itemLength);

        uint256 start = itemOffset;
        bytes32 itemPtr = item.ptr;
        bytes memory result = new bytes(itemLength);
        assembly ("memory-safe") {
            mcopy(add(result, 0x20), add(itemPtr, start), itemLength)
        }

        return result;
    }

    /// @dev Same as {readBytes} but for `bytes`. See {toItem}.
    function readBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(toItem(item));
    }

    /// @dev Reads the raw bytes of an RLP item without decoding the content. Includes prefix bytes.
    function readRawBytes(Item memory item) internal pure returns (bytes memory) {
        bytes32 itemPtr = item.ptr;
        uint256 itemLength = item.length;
        bytes memory result = new bytes(itemLength);
        assembly ("memory-safe") {
            mcopy(add(result, 0x20), itemPtr, itemLength)
        }

        return result;
    }

    /// @dev Checks if a buffer is a single byte below 128 (0x80). Encoded as-is in RLP.
    function _isSingleByte(bytes memory buffer) private pure returns (bool) {
        return buffer.length == 1 && uint8(buffer[0]) <= SHORT_OFFSET - 1;
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
        bytes32 dataPtr = _skippedLengthPtr(flattened);
        for (uint256 i = 0; i < list.length; i++) {
            bytes memory item = list[i];
            uint256 length = item.length;
            _copy(dataPtr, _skippedLengthPtr(item), length);
            dataPtr = bytes32(uint256(dataPtr) + length);
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
        require(item.length != 0);
        bytes32 ptr = item.ptr;
        uint256 prefix = uint8(_extractMemoryByte(ptr));

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
        require(item.length > strLength);
        require(strLength != 1 || _extractMemoryByte(bytes32(uint256(item.ptr) + 1)) >= bytes1(SHORT_OFFSET));
        return (1, strLength, ItemType.DATA_ITEM);
    }

    /// @dev Decodes a short list (0-55 bytes). The first byte contains the length of the entire list.
    function _decodeShortList(
        uint256 listLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > listLength);
        return (1, listLength, ItemType.LIST_ITEM);
    }

    /// @dev Decodes a long string or list (>55 bytes). The first byte indicates the length of the length, followed by the length itself.
    function _decodeLong(uint256 lengthLength, Item memory item) private pure returns (uint256 offset, uint256 length) {
        lengthLength += 1; // 1 byte for the length itself
        require(item.length > lengthLength);
        require(_extractMemoryByte(item.ptr) != 0x00);

        // Extract the length value from the next bytes
        uint256 len = _extractMemoryWord(bytes32(uint256(item.ptr) + 1)) >> (256 - 8 * lengthLength);
        require(len > SHORT_OFFSET);
        require(item.length <= lengthLength + len);
        return (lengthLength + 1, len);
    }

    function _copy(bytes32 destPtr, bytes32 srcPtr, uint256 length) private pure returns (bytes memory src) {
        assembly ("memory-safe") {
            mcopy(destPtr, srcPtr, length)
            src := mload(src)
        }
    }

    function _skippedLengthPtr(bytes memory buffer) private pure returns (bytes32 ptr) {
        assembly ("memory-safe") {
            ptr := add(buffer, 32)
        }
    }

    function _extractMemoryByte(bytes32 ptr) private pure returns (bytes1 v) {
        assembly ("memory-safe") {
            v := byte(0, mload(ptr))
        }
    }

    function _extractMemoryWord(bytes32 ptr) private pure returns (uint256 v) {
        assembly ("memory-safe") {
            v := mload(ptr)
        }
    }

    function _buffer(bytes32 ptr) private pure returns (bytes memory buffer) {
        assembly ("memory-safe") {
            buffer := ptr
        }
    }
}
