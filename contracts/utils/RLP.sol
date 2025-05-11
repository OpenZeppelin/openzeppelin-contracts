// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {Endianness} from "./math/Endianness.sol";
import {Bytes} from "./Bytes.sol";

library RLP {
    using Bytes for bytes;

    struct Item {
        uint256 length; // Total length of the item in bytes
        bytes32 ptr; // Memory pointer to the start of the item
    }

    enum ItemType {
        DATA_ITEM, // Single data value
        LIST_ITEM // List of RLP encoded items
    }

    uint8 internal constant SHORT_THRESHOLD = 55; // Maximum length for data that will be encoded using the short format

    uint8 internal constant SHORT_OFFSET = 128; // Prefix for short string (0-55 bytes)
    uint8 internal constant LONG_LENGTH_OFFSET = SHORT_OFFSET + SHORT_THRESHOLD + 1; // 184 - Prefix for long string length
    uint8 internal constant LONG_OFFSET = LONG_LENGTH_OFFSET + 8; // 192 - Prefix for list items
    uint8 internal constant SHORT_LIST_OFFSET = LONG_OFFSET + SHORT_THRESHOLD + 1; // 248 - Prefix for long list length

    function encode(bytes memory buffer) internal pure returns (bytes memory) {
        // Single bytes below 128 are encoded as themselves, otherwise as length prefix + data
        return _isSingleByte(buffer) ? buffer : bytes.concat(_encodeLength(buffer.length, SHORT_OFFSET), buffer);
    }

    function encode(bytes[] memory list) internal pure returns (bytes memory) {
        bytes memory flattened = _flatten(list);
        return bytes.concat(_encodeLength(flattened.length, LONG_OFFSET), flattened);
    }

    function encode(string memory str) internal pure returns (bytes memory) {
        return encode(bytes(str));
    }

    function encode(address addr) internal pure returns (bytes memory) {
        return encode(abi.encodePacked(addr));
    }

    function encode(uint256 value) internal pure returns (bytes memory) {
        return encode(_toBinaryBuffer(value));
    }

    function encode(bytes32 value) internal pure returns (bytes memory) {
        return encode(_toBinaryBuffer(uint256(value)));
    }

    function encode(bool value) internal pure returns (bytes memory) {
        bytes memory encoded = new bytes(1);
        encoded[0] = value ? bytes1(0x01) : bytes1(SHORT_OFFSET); // false is encoded as an empty string
        return encoded;
    }

    function toItem(bytes memory value) internal pure returns (Item memory) {
        require(value.length != 0); // Empty arrays are not RLP items.
        return Item(value.length, _skippedLengthPtr(value));
    }

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

    function readList(bytes memory value) internal pure returns (Item[] memory) {
        return readList(toItem(value));
    }

    function readBytes(Item memory item) internal pure returns (bytes memory) {
        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.DATA_ITEM);
        require(item.length == itemOffset + itemLength);
        return _copy(item.ptr, bytes32(itemOffset), itemLength);
    }

    function readBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(toItem(item));
    }

    function readRawBytes(Item memory item) internal pure returns (bytes memory) {
        return _copy(item.ptr, 0, item.length);
    }

    function _isSingleByte(bytes memory buffer) private pure returns (bool) {
        return buffer.length == 1 && uint8(buffer[0]) <= SHORT_OFFSET - 1;
    }

    function _encodeLength(uint256 length, uint256 offset) private pure returns (bytes memory) {
        return
            length <= SHORT_THRESHOLD
                ? abi.encodePacked(bytes1(uint8(length) + uint8(offset)))
                : _encodeLongLength(length, offset);
    }

    function _encodeLongLength(uint256 length, uint256 offset) private pure returns (bytes memory) {
        uint256 bytesLength = Math.log256(length) + 1; // Result is floored
        return
            abi.encodePacked(
                bytes1(uint8(bytesLength) + uint8(offset) + SHORT_THRESHOLD),
                Endianness.reverseUint256(length) // to big-endian
            );
    }

    function _toBinaryBuffer(uint256 value) private pure returns (bytes memory) {
        uint256 leadingZeroes = _countLeadingZeroBytes(value);
        return abi.encodePacked(value).slice(leadingZeroes);
    }

    function _countLeadingZeroBytes(uint256 x) private pure returns (uint256) {
        uint256 r = 0;
        if (x > 0xffffffffffffffffffffffffffffffff) r = 128; // Upper 128 bits
        if ((x >> r) > 0xffffffffffffffff) r |= 64; // Next 64 bits
        if ((x >> r) > 0xffffffff) r |= 32; // Next 32 bits
        if ((x >> r) > 0xffff) r |= 16; // Next 16 bits
        if ((x >> r) > 0xff) r |= 8; // Next 8 bits
        return 31 ^ (r >> 3); // Convert to leading zero bytes count
    }

    function _flatten(bytes[] memory list) private pure returns (bytes memory) {
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

    function _totalLength(bytes[] memory list) private pure returns (uint256) {
        uint256 totalLength;
        for (uint256 i = 0; i < list.length; i++) {
            totalLength += list[i].length;
        }
        return totalLength;
    }

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

    function _decodeShortString(
        uint256 strLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > strLength);
        require(strLength != 1 || _extractMemoryByte(bytes32(uint256(item.ptr) + 1)) >= bytes1(SHORT_OFFSET));
        return (1, strLength, ItemType.DATA_ITEM);
    }

    function _decodeShortList(
        uint256 listLength,
        Item memory item
    ) private pure returns (uint256 offset, uint256 length, ItemType) {
        require(item.length > listLength);
        return (1, listLength, ItemType.LIST_ITEM);
    }

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
}
