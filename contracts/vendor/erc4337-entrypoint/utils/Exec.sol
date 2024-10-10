// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.23;

// solhint-disable no-inline-assembly

/**
 * Utility functions helpful when making different kinds of contract calls in Solidity.
 */
library Exec {
    function call(address to, uint256 value, bytes memory data, uint256 txGas) internal returns (bool success) {
        assembly ("memory-safe") {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function staticcall(address to, bytes memory data, uint256 txGas) internal view returns (bool success) {
        assembly ("memory-safe") {
            success := staticcall(txGas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function delegateCall(address to, bytes memory data, uint256 txGas) internal returns (bool success) {
        assembly ("memory-safe") {
            success := delegatecall(txGas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    // get returned data from last call or calldelegate
    function getReturnData(uint256 maxLen) internal pure returns (bytes memory returnData) {
        assembly ("memory-safe") {
            let len := returndatasize()
            if gt(len, maxLen) {
                len := maxLen
            }
            let ptr := mload(0x40)
            mstore(0x40, add(ptr, add(len, 0x20)))
            mstore(ptr, len)
            returndatacopy(add(ptr, 0x20), 0, len)
            returnData := ptr
        }
    }

    // revert with explicit byte array (probably reverted info from call)
    function revertWithData(bytes memory returnData) internal pure {
        assembly ("memory-safe") {
            revert(add(returnData, 32), mload(returnData))
        }
    }

    function callAndRevert(address to, bytes memory data, uint256 maxLen) internal {
        bool success = call(to, 0, data, gasleft());
        if (!success) {
            revertWithData(getReturnData(maxLen));
        }
    }
}
