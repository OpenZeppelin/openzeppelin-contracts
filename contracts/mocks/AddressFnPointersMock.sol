// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Address.sol";

/**
 * @dev A mock to expose `Address`'s functions with function pointers.
 */
contract AddressFnPointerMock {
    error CustomOnRevert();

    function functionCall(address target, bytes memory data) external returns (bytes memory) {
        return Address.functionCall(target, data, _onRevert);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) external returns (bytes memory) {
        return Address.functionCallWithValue(target, data, value, _onRevert);
    }

    function functionStaticCall(address target, bytes memory data) external view returns (bytes memory) {
        return Address.functionStaticCall(target, data, _onRevert);
    }

    function functionDelegateCall(address target, bytes memory data) external returns (bytes memory) {
        return Address.functionDelegateCall(target, data, _onRevert);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) external view returns (bytes memory) {
        return Address.verifyCallResultFromTarget(target, success, returndata, _onRevert);
    }

    function verifyCallResult(bool success, bytes memory returndata) external view returns (bytes memory) {
        return Address.verifyCallResult(success, returndata, _onRevert);
    }

    function verifyCallResultVoid(bool success, bytes memory returndata) external view returns (bytes memory) {
        return Address.verifyCallResult(success, returndata, _onRevertVoid);
    }

    function _onRevert() internal pure {
        revert CustomOnRevert();
    }

    function _onRevertVoid() internal pure {}
}
