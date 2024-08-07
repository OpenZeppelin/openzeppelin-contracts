// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Math} from "./math/Math.sol";

/**
 * Utility functions helpful when making different kinds of contract calls in Solidity.
 */
library Call {
    function call(address to, uint256 value, bytes memory data) internal returns (bool success) {
        return call(to, value, data, gasleft());
    }

    function call(address to, uint256 value, bytes memory data, uint256 txGas) internal returns (bool success) {
        assembly ("memory-safe") {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function staticcall(address to, bytes memory data) internal view returns (bool success) {
        return staticcall(to, data, gasleft());
    }

    function staticcall(address to, bytes memory data, uint256 txGas) internal view returns (bool success) {
        assembly ("memory-safe") {
            success := staticcall(txGas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function delegateCall(address to, bytes memory data) internal returns (bool success) {
        return delegateCall(to, data, gasleft());
    }

    function delegateCall(address to, bytes memory data, uint256 txGas) internal returns (bool success) {
        assembly ("memory-safe") {
            success := delegatecall(txGas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function getReturnDataSize() internal pure returns (uint256 returnDataSize) {
        assembly ("memory-safe") {
            returnDataSize := returndatasize()
        }
    }

    function getReturnData(uint256 maxLen) internal pure returns (bytes memory ptr) {
        return getReturnDataFixed(Math.min(maxLen, getReturnDataSize()));
    }

    function getReturnDataFixed(uint256 len) internal pure returns (bytes memory ptr) {
        assembly ("memory-safe") {
            ptr := mload(0x40)
            mstore(0x40, add(ptr, add(len, 0x20)))
            mstore(ptr, len)
            returndatacopy(add(ptr, 0x20), 0, len)
        }
    }

    function revertWithData(bytes memory returnData) internal pure {
        assembly ("memory-safe") {
            revert(add(returnData, 0x20), mload(returnData))
        }
    }

    function revertWithCode(bytes32 code) internal pure {
        assembly ("memory-safe") {
            mstore(0, code)
            revert(0, 0x20)
        }
    }
}
