// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AccountEIP7702WithModulesMock} from "../patched/mocks/account/AccountMock.sol";
import {EIP712} from "../patched/utils/cryptography/EIP712.sol";
import {EnumerableSet} from "../patched/utils/structs/EnumerableSet.sol";

contract AccountHarness is AccountEIP7702WithModulesMock {
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(string memory name, string memory version) EIP712(name, version) {}

    function getFallbackHandler(bytes4 selector) external view returns (address) {
        return _fallbackHandler(selector);
    }

    function getDataSelector(bytes memory data) external pure returns (bytes4) {
        return bytes4(data);
    }

    function _validatorContains(address module) external view returns (bool) {
        return _validators.contains(module);
    }

    function _validatorLength() external view returns (uint256) {
        return _validators.length();
    }

    function _validatorAt(uint256 index) external view returns (address) {
        return _validators.at(index);
    }

    function _validatorAtFull(uint256 index) external view returns (bytes32) {
        return _validators._inner._values[index];
    }

    function _validatorPositionOf(address module) external view returns (uint256) {
        return _validators._inner._positions[bytes32(uint256(uint160(module)))];
    }

    function _executorContains(address module) external view returns (bool) {
        return _executors.contains(module);
    }

    function _executorLength() external view returns (uint256) {
        return _executors.length();
    }

    function _executorAt(uint256 index) external view returns (address) {
        return _executors.at(index);
    }

    function _executorAtFull(uint256 index) external view returns (bytes32) {
        return _executors._inner._values[index];
    }

    function _executorPositionOf(address module) external view returns (uint256) {
        return _executors._inner._positions[bytes32(uint256(uint160(module)))];
    }
}
