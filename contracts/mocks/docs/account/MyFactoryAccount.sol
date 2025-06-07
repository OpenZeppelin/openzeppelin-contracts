// contracts/MyFactoryAccount.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../../../proxy/Clones.sol";
import {Address} from "../../../utils/Address.sol";

/**
 * @dev A factory contract to create accounts on demand.
 */
contract MyFactoryAccount {
    using Clones for address;
    using Address for address;

    address private immutable _impl;

    constructor(address impl_) {
        _impl = impl_;
    }

    /// @dev Predict the address of the account
    function predictAddress(bytes32 salt, bytes calldata callData) public view returns (address, bytes32) {
        bytes32 calldataSalt = _saltedCallData(salt, callData);
        return (_impl.predictDeterministicAddress(calldataSalt, address(this)), calldataSalt);
    }

    /// @dev Create clone accounts on demand
    function cloneAndInitialize(bytes32 salt, bytes calldata callData) public returns (address) {
        return _cloneAndInitialize(salt, callData);
    }

    /// @dev Create clone accounts on demand and return the address. Uses `callData` to initialize the clone.
    function _cloneAndInitialize(bytes32 salt, bytes calldata callData) internal returns (address) {
        (address predicted, bytes32 _calldataSalt) = predictAddress(salt, callData);
        if (predicted.code.length == 0) {
            _impl.cloneDeterministic(_calldataSalt);
            predicted.functionCall(callData);
        }
        return predicted;
    }

    function _saltedCallData(bytes32 salt, bytes calldata callData) internal pure returns (bytes32) {
        // Scope salt to the callData to avoid front-running the salt with a different callData
        return keccak256(abi.encodePacked(salt, callData));
    }
}
