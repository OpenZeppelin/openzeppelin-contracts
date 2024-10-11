// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Math} from "./math/Math.sol";

/**
 * @dev Bytes operations.
 */
library Bytes {
    /// @dev Reads a bytes32 from a bytes array without bounds checking.
    function unsafeReadBytesOffset(bytes memory buffer, uint256 offset) internal pure returns (bytes32 value) {
        // This is not memory safe in the general case
        assembly {
            value := mload(add(buffer, add(0x20, offset)))
        }
    }
}
