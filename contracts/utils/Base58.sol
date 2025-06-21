// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {SafeCast} from "./math/SafeCast.sol";
import {Bytes} from "./Bytes.sol";

/**
 * @dev Provides a set of functions to operate with Base58 strings.
 *
 * Based on the original https://github.com/storyicon/base58-solidity/commit/807428e5174e61867e4c606bdb26cba58a8c5cb1[implementation of storyicon] (MIT).
 */
library Base58 {
    using SafeCast for bool;
    using Bytes for bytes;

    error InvalidBase56Digit(uint8);

    /**
     * @dev Base58 encoding and decoding tables
     */
    bytes internal constant _TABLE = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    bytes internal constant _LOOKUP_TABLE =
        hex"000102030405060708ffffffffffffff090a0b0c0d0e0f10ff1112131415ff161718191a1b1c1d1e1f20ffffffffffff2122232425262728292a2bff2c2d2e2f30313233343536373839";

    /**
     * @dev Encode a `bytes` buffer as a Base58 `string`.
     */
    function encode(bytes memory data) internal pure returns (string memory) {
        return string(_encode(data));
    }

    /**
     * @dev Decode a Base58 `string` into a `bytes` buffer.
     */
    function decode(string memory data) internal pure returns (bytes memory) {
        return _decode(bytes(data));
    }

    function _encode(bytes memory data) private pure returns (bytes memory) {
        unchecked {
            uint256 dataCLZ = data.countLeading(0x00);
            uint256 length = dataCLZ + ((data.length - dataCLZ) * 8351) / 6115 + 1;
            bytes memory slot = new bytes(length);

            uint256 end = length;
            for (uint256 i = 0; i < data.length; i++) {
                uint256 ptr = length;
                for (uint256 carry = _mload8i(data, i); ptr > end || carry != 0; --ptr) {
                    carry += 256 * _mload8i(slot, ptr - 1);
                    _mstore8i(slot, ptr - 1, uint8(carry % 58));
                    carry /= 58;
                }
                end = ptr;
            }

            uint256 slotCLZ = slot.countLeading(0x00);
            length -= slotCLZ - dataCLZ;
            slot.splice(slotCLZ - dataCLZ);

            bytes memory cache = _TABLE;
            for (uint256 i = 0; i < length; ++i) {
                // equivalent to `slot[i] = TABLE[slot[i]];`
                _mstore8(slot, i, _mload8(cache, _mload8i(slot, i)));
            }

            return slot;
        }
    }

    function _decode(bytes memory data) private pure returns (bytes memory) {
        unchecked {
            uint256 b58Length = data.length;

            uint256 size = 2 * ((b58Length * 8351) / 6115 + 1);
            bytes memory binu = new bytes(size);

            bytes memory cache = _LOOKUP_TABLE;
            uint256 outiLength = (b58Length + 3) / 4;
            // Note: allocating uint32[] would be enough, but solidity doesn't pack memory.
            uint256[] memory outi = new uint256[](outiLength);
            for (uint256 i = 0; i < data.length; ++i) {
                // get b58 char
                uint8 chr = _mload8i(data, i);
                require(chr > 48 && chr < 123, InvalidBase56Digit(chr));

                // decode b58 char
                uint256 carry = _mload8i(cache, chr - 49);
                require(carry < 58, InvalidBase56Digit(chr));

                for (uint256 j = outiLength; j > 0; --j) {
                    uint256 value = carry + 58 * outi[j - 1];
                    carry = value >> 32;
                    outi[j - 1] = value & 0xffffffff;
                }
            }

            uint256 ptr = 0;
            uint256 mask = ((b58Length - 1) % 4) + 1;
            for (uint256 j = 0; j < outiLength; ++j) {
                while (mask > 0) {
                    --mask;
                    _mstore8(binu, ptr, bytes1(uint8(outi[j] >> (8 * mask))));
                    ptr++;
                }
                mask = 4;
            }

            uint256 dataCLZ = data.countLeading(0x31);
            uint256 msb = binu.countConsecutive(dataCLZ, 0x00);
            return binu.splice(msb * (dataCLZ + msb < binu.length).toUint(), ptr);
        }
    }

    function _mload8(bytes memory buffer, uint256 offset) private pure returns (bytes1 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }

    function _mload8i(bytes memory buffer, uint256 offset) private pure returns (uint8 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := shr(248, mload(add(add(buffer, 0x20), offset)))
        }
    }

    function _mstore8(bytes memory buffer, uint256 offset, bytes1 value) private pure {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            mstore8(add(add(buffer, 0x20), offset), shr(248, value))
        }
    }

    function _mstore8i(bytes memory buffer, uint256 offset, uint8 value) private pure {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            mstore8(add(add(buffer, 0x20), offset), value)
        }
    }
}
