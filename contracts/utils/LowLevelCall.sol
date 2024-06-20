// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Errors} from "./Errors.sol";

/**
 * @dev Library of low level call functions that implement different calling strategies to deal with the return data.
 */
library LowLevelCall {
    /// === CALL ===

    /// @dev Performs a Solidity function call using a low level `call` and ignoring the return data.
    function callRaw(address target, uint256 value, bytes memory data) internal returns (bool success) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `call` and returns the first 32 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a single-word value.
    ///
    /// WARNING: Do not assume that the result is zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function callReturnBytes32(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool success, bytes32 result) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0x20)
            result := mload(0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `call` and returns the first 64 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a tuple of single-word values values.
    ///
    /// WARNING: Do not assume that the results are zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function callReturnBytes32Tuple(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool success, bytes32 result1, bytes32 result2) {
        assembly ("memory-safe") {
            success := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0x40)
            result1 := mload(0)
            result2 := mload(0x20)
        }
    }

    /// @dev Performs a Solidity function call using a low level `call` and writes the result to the memory location
    /// specified by `resultPtr`.
    ///
    /// IMPORTANT: This function assumes that the length of the memory array is stored in the first 32 bytes of the array and uses it for truncating
    /// returndata if it's longer than the allocated memory to avoid corrupting to further places in memory. The `resultPtr` should be a
    /// memory location that is already allocated with a predefined length.
    ///
    /// WARNING: Do not use if writing to `resultPtr` is not safe according to
    /// the https://docs.soliditylang.org/en/latest/assembly.html#memory-safety[Solidity documentation].
    function callReturnOverride(
        address target,
        uint256 value,
        bytes memory data,
        bytes memory resultPtr
    ) internal returns (bool success) {
        assembly ("memory-safe") {
            let maxSize := mload(resultPtr)
            success := call(gas(), target, value, add(data, 0x20), mload(data), resultPtr, maxSize)
        }
    }

    /// === STATICCALL ===

    /// @dev Performs a Solidity function call using a low level `staticcall` and ignoring the return data.
    function staticCallRaw(address target, bytes memory data) internal view returns (bool success) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `staticcall` and returns the first 32 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a single-word value.
    ///
    /// WARNING: Do not assume that the result is zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function staticCallReturnBytes32(
        address target,
        bytes memory data
    ) internal view returns (bool success, bytes32 result) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0x20)
            result := mload(0)
        }
    }

    /// @dev Performs a Solidity function call using a low level `staticcall` and returns the first 64 bytes of the result
    /// in the scratch space of memory. Useful for functions that return a tuple of single-word values values.
    ///
    /// WARNING: Do not assume that the results are zero if `success` is false. Memory can be already allocated
    /// and this function doesn't zero it out.
    function staticCallReturnBytes32Tuple(
        address target,
        bytes memory data
    ) internal view returns (bool success, bytes32 result1, bytes32 result2) {
        assembly ("memory-safe") {
            success := staticcall(gas(), target, add(data, 0x20), mload(data), 0, 0x40)
            result1 := mload(0)
            result2 := mload(0x20)
        }
    }

    /// @dev Performs a Solidity function call using a low level `staticcall` and writes the result to the memory location
    /// specified by `resultPtr`.
    ///
    /// IMPORTANT: This function assumes that the length of the memory array is stored in the first 32 bytes of the array and uses it for truncating
    /// returndata if it's longer than the allocated memory to avoid corrupting to further places in memory. The `resultPtr` should be a
    /// memory location that is already allocated with a predefined length.
    ///
    /// WARNING: Do not use if writing to `resultPtr` is not safe according to
    /// the https://docs.soliditylang.org/en/latest/assembly.html#memory-safety[Solidity documentation].
    function staticCallReturnOverride(
        address target,
        bytes memory data,
        bytes memory resultPtr
    ) internal view returns (bool success) {
        assembly ("memory-safe") {
            let maxSize := mload(resultPtr)
            success := staticcall(gas(), target, add(data, 0x20), mload(data), resultPtr, maxSize)
        }
    }

    /// @dev Returns the size of the return data buffer.
    function returnDataSize() internal pure returns (uint256 size) {
        assembly ("memory-safe") {
            size := returndatasize()
        }
    }
}
