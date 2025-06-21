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

    string internal constant _TABLE = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    function encode(bytes memory data) internal pure returns (string memory) {
        return string(_encode(data));
    }

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

            bytes memory cache = bytes(_TABLE);
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

            bytes memory cache = bytes(_TABLE);
            uint32[] memory outi = new uint32[]((b58Length + 3) / 4);
            for (uint256 i = 0; i < data.length; i++) {
                bytes1 r = _mload8(data, i);
                uint256 c = cache.indexOf(r); // can we avoid the loop here ?
                require(c != type(uint256).max, "invalid base58 digit");
                for (uint256 k = outi.length; k > 0; --k) {
                    uint256 t = uint64(outi[k - 1]) * 58 + c;
                    c = t >> 32;
                    outi[k - 1] = uint32(t & 0xffffffff);
                }
            }

            uint256 ptr = 0;
            uint256 mask = ((b58Length - 1) % 4) + 1;
            for (uint256 j = 0; j < outi.length; ++j) {
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
