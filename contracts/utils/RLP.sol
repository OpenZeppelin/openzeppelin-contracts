// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Math} from "./math/Math.sol";
import {Bytes} from "./Bytes.sol";
import {Memory} from "./Memory.sol";
import {Panic} from "./Panic.sol";
import {Packing} from "./Packing.sol";

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

    enum ItemType {
        Data, // Single data value
        List // List of RLP encoded items
    }

    /// @dev Reads the raw bytes of an RLP item without decoding the content. Includes prefix bytes.
    // TODO: is there a usecase for that?
    function readRawBytes(Memory.Slice item) internal pure returns (bytes memory) {
        return item.toBytes();
    }

    /// @dev Decode an RLP encoded bytes32. See {encode-bytes32}
    function readBytes32(Memory.Slice item) internal pure returns (bytes32) {
        uint256 length = item.length();
        require(length <= 33, RLPContentLengthMismatch(32, length));

        (uint256 itemOffset, uint256 itemLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPUnexpectedType(ItemType.Data, itemType));

        return item.load(itemOffset) >> (256 - 8 * itemLength);
    }

    /// @dev Decode an RLP encoded uint256. See {encode-uint256}
    function readUint256(Memory.Slice item) internal pure returns (uint256) {
        return uint256(readBytes32(item));
    }

    /// @dev Decode an RLP encoded address. See {encode-address}
    function readAddress(Memory.Slice item) internal pure returns (address) {
        uint256 length = item.length();
        require(length == 1 || length == 21, RLPContentLengthMismatch(21, length));
        return address(uint160(readUint256(item)));
    }

    /// @dev Decodes an RLP encoded bytes. See {encode-bytes}
    function readBytes(Memory.Slice item) internal pure returns (bytes memory) {
        (uint256 offset, uint256 length, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.Data, RLPUnexpectedType(ItemType.Data, itemType));

        // Length is checked by {toBytes}
        return item.slice(offset, length).toBytes();
    }

    /// @dev Decodes an RLP encoded list into an array of RLP Items. This function supports list up to 32 elements
    function readList(Memory.Slice item) internal pure returns (Memory.Slice[] memory) {
        return readList(item, 32);
    }

    /**
     * @dev Variant of {readList-bytes32} that supports long lists up to `maxListLength`. Setting `maxListLength` to
     * a high value will cause important, and costly, memory expansion.
     */
    function readList(Memory.Slice item, uint256 maxListLength) internal pure returns (Memory.Slice[] memory) {
        uint256 itemLength = item.length();

        (uint256 listOffset, uint256 listLength, ItemType itemType) = _decodeLength(item);
        require(itemType == ItemType.List, RLPUnexpectedType(ItemType.List, itemType));
        require(itemLength == listOffset + listLength, RLPContentLengthMismatch(listOffset + listLength, itemLength));

        Memory.Slice[] memory list = new Memory.Slice[](maxListLength);

        uint256 itemCount;
        for (uint256 currentOffset = listOffset; currentOffset < itemLength; ++itemCount) {
            (uint256 elementOffset, uint256 elementLength, ) = _decodeLength(item.slice(currentOffset));
            list[itemCount] = item.slice(currentOffset, elementLength + elementOffset);
            currentOffset += elementOffset + elementLength;
        }

        // Decrease the array size to match the actual item count.
        assembly ("memory-safe") {
            mstore(list, itemCount)
        }
        return list;
    }

    function decodeAddress(bytes memory item) internal pure returns (address) {
        return readAddress(item.asSlice());
    }

    function decodeUint256(bytes memory item) internal pure returns (uint256) {
        return readUint256(item.asSlice());
    }

    function decodeBytes32(bytes memory item) internal pure returns (bytes32) {
        return readBytes32(item.asSlice());
    }

    /// @dev Same as {decodeBytes} but for `bytes`. See {decode}.
    function decodeBytes(bytes memory item) internal pure returns (bytes memory) {
        return readBytes(item.asSlice());
    }

    /// @dev Same as {decodeList} but for `bytes`. See {decode}.
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

        require(itemLength != 0, RLPEmptyItem());
        uint8 prefix = uint8(bytes1(item.load(0)));

        if (prefix < LONG_OFFSET) {
            // CASE: item
            if (prefix < SHORT_OFFSET) {
                // Case: Single byte below 128
                return (0, 1, ItemType.Data);
            } else if (prefix < LONG_LENGTH_OFFSET) {
                // Case: Short string (0-55 bytes)
                uint256 strLength = prefix - SHORT_OFFSET;
                require(itemLength > strLength, RLPInvalidDataRemainder(strLength, itemLength));
                if (strLength == 1) {
                    require(bytes1(item.load(1)) >= bytes1(SHORT_OFFSET));
                }
                return (1, strLength, ItemType.Data);
            } else {
                // Case: Long string (>55 bytes)
                uint256 lengthLength = prefix - 0xb7;

                require(itemLength > lengthLength, RLPInvalidDataRemainder(lengthLength, itemLength));
                require(bytes1(item.load(0)) != 0x00);

                uint256 len = uint256(item.load(1)) >> (256 - 8 * lengthLength);
                require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
                require(itemLength > lengthLength + len, RLPContentLengthMismatch(lengthLength + len, itemLength));

                return (lengthLength + 1, len, ItemType.Data);
            }
        } else {
            // Case: list
            if (prefix < SHORT_LIST_OFFSET) {
                // Case: Short list
                uint256 listLength = prefix - LONG_OFFSET;
                require(item.length() > listLength, RLPInvalidDataRemainder(listLength, itemLength));
                return (1, listLength, ItemType.List);
            } else {
                // Case: Long list
                uint256 lengthLength = prefix - 0xf7;

                require(itemLength > lengthLength, RLPInvalidDataRemainder(lengthLength, itemLength));
                require(bytes1(item.load(0)) != 0x00);

                uint256 len = uint256(item.load(1)) >> (256 - 8 * lengthLength);
                require(len > SHORT_THRESHOLD, RLPInvalidDataRemainder(SHORT_THRESHOLD, len));
                require(itemLength > lengthLength + len, RLPContentLengthMismatch(lengthLength + len, itemLength));

                return (lengthLength + 1, len, ItemType.List);
            }
        }
    }
}
