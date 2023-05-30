// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Address.sol";

/**
 * @dev A mock to expose `Address`'s functions with function pointers.
 */
contract AddressFnPointerMock {
    error CustomRevert();

    function functionCall(address target, bytes memory data) external returns (bytes memory) {
        return Address.functionCall(target, data, _customRevert);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) external returns (bytes memory) {
        return Address.functionCallWithValue(target, data, value, _customRevert);
    }

    function functionStaticCall(address target, bytes memory data) external view returns (bytes memory) {
        return Address.functionStaticCall(target, data, _customRevert);
    }

    function functionDelegateCall(address target, bytes memory data) external returns (bytes memory) {
        return Address.functionDelegateCall(target, data, _customRevert);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) external view returns (bytes memory) {
        return Address.verifyCallResultFromTarget(target, success, returndata, _customRevert);
    }

    function verifyCallResult(bool success, bytes memory returndata) external view returns (bytes memory) {
        return Address.verifyCallResult(success, returndata, _customRevert);
    }

    function verifyCallResultVoid(bool success, bytes memory returndata) external view returns (bytes memory) {
        return Address.verifyCallResult(success, returndata, _customRevertVoid);
    }

    function _customRevert() internal pure {
        revert CustomRevert();
    }

    function _customRevertVoid() internal pure {}
}
