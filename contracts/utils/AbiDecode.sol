// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Calldata} from "./Calldata.sol";
import {Memory} from "./Memory.sol";

/// @dev Utilities to decode ABI-encoded data without reverting.
library AbiDecode {
    using Memory for *;

    /**
     * @dev Attempts to decode a `bytes` value from a bytes input (in memory). Returns a boolean indicating success
     * and a slice pointing to the decoded buffer. If decoding fails, returns an empty slice.
     */
    function tryDecodeBytes(bytes memory input) internal pure returns (bool success, Memory.Slice output) {
        return tryDecodeBytes(input.asSlice());
    }

    /**
     * @dev Attempts to decode a `bytes` value from a Memory.Slice input. Returns a boolean indicating success and a
     * slice pointing to the decoded buffer. If decoding fails, returns an empty slice.
     */
    function tryDecodeBytes(Memory.Slice input) internal pure returns (bool success, Memory.Slice output) {
        unchecked {
            uint256 inputLength = input.length();
            if (inputLength < 0x20) {
                return (false, Memory.emptySlice());
            }
            uint256 offset = uint256(input.load(0));
            if (inputLength - 0x20 < offset) {
                return (false, Memory.emptySlice());
            }
            uint256 length = uint256(input.load(offset));
            if (inputLength - 0x20 - offset < length) {
                return (false, Memory.emptySlice());
            }
            return (true, input.slice(0x20 + offset, length));
        }
    }

    /**
     * @dev Attempts to decode a `bytes` value from a bytes input (in calldata). Returns a boolean indicating success
     * and a slice pointing to the decoded buffer. If decoding fails, returns an empty slice.
     */
    function tryDecodeBytesCalldata(bytes calldata input) internal pure returns (bool success, bytes calldata output) {
        unchecked {
            uint256 inputLength = input.length;
            if (inputLength < 0x20) {
                return (false, Calldata.emptyBytes());
            }
            uint256 offset = uint256(bytes32(input[0x00:0x20]));
            if (inputLength - 0x20 < offset) {
                return (false, Calldata.emptyBytes());
            }
            uint256 length = uint256(bytes32(input[offset:offset + 0x20]));
            if (inputLength - 0x20 - offset < length) {
                return (false, Calldata.emptyBytes());
            }
            return (true, input[0x20 + offset:0x20 + offset + length]);
        }
    }
}
