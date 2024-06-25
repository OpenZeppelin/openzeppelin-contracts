// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Errors} from "./Errors.sol";

/**
 * @dev Library of low level call functions that implement different calling strategies to deal with the return data.
 */
library LowLevelCall {
    /// === CALL ===

    /// @dev Performs a Solidity function call using a low level `call` and ignoring the return data.
    function callRaw(address target, bytes memory data) internal returns (bool success) {
        return callRaw(target, data, 0);
    }

    /// @dev Same as {callRaw}, but allows to specify the value to be sent in the call.
    function callRaw(address target, bytes memory data, uint256 value) internal returns (bool success) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `call` and returns the first 32 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a single-word value.
    ///
    /// WARNING: Do not assume that the result is zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function callReturnScratchBytes32(
        address target,
        bytes memory data
    ) internal returns (bool success, bytes32 result) {
        return callReturnScratchBytes32(target, data, 0);
    }

    /// @dev Same as {callReturnScratchBytes32}, but allows to specify the value to be sent in the call.
    function callReturnScratchBytes32(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bool success, bytes32 result) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0x20)
            result := mload(0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `call` and returns the first 64 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a tuple of single-word values.
    ///
    /// WARNING: Do not assume that the results are zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function callReturnScratchBytes32Pair(
        address target,
        bytes memory data
    ) internal returns (bool success, bytes32 result1, bytes32 result2) {
        return callReturnScratchBytes32Pair(target, data, 0);
    }

    /// @dev Same as {callReturnScratchBytes32Pair}, but allows to specify the value to be sent in the call.
    function callReturnScratchBytes32Pair(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bool success, bytes32 result1, bytes32 result2) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0x40)
            result1 := mload(0)
            result2 := mload(0x20)
        }
    }

    /// === STATICCALL ===

    /// @dev Performs a Solidity function call using a low level `staticcall` and ignoring the return data.
    function staticcallRaw(address target, bytes memory data) internal view returns (bool success) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `staticcall` and returns the first 32 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a single-word value.
    ///
    /// WARNING: Do not assume that the result is zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function staticcallReturnScratchBytes32(
        address target,
        bytes memory data
    ) internal view returns (bool success, bytes32 result) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0x20)
            result := mload(0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `staticcall` and returns the first 64 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a tuple of single-word values.
    ///
    /// WARNING: Do not assume that the results are zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function staticcallReturnScratchBytes32Pair(
        address target,
        bytes memory data
    ) internal view returns (bool success, bytes32 result1, bytes32 result2) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0x40)
            result1 := mload(0)
            result2 := mload(0x20)
        }
    }

    /// @dev Returns the size of the return data buffer.
    function returnDataSize() internal pure returns (uint256 size) {
        assembly ("memory-safe") {
            size := returndatasize()
        }
    }
}
