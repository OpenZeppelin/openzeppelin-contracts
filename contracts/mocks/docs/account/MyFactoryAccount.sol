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
        require(impl_.code.length > 0);
        _impl = impl_;
    }

    /// @dev Predict the address of the account
    function predictAddress(bytes32 salt, bytes calldata callData) public view returns (address) {
        return (_impl.predictDeterministicAddress(_saltedCallData(salt, callData), address(this)));
    }

    /// @dev Create clone accounts on demand
    function cloneAndInitialize(bytes32 salt, bytes calldata callData) public returns (address) {
        address predicted = predictAddress(salt, callData);
        if (predicted.code.length == 0) {
            _impl.cloneDeterministic(_saltedCallData(salt, callData));
            predicted.functionCall(callData);
        }
        return predicted;
    }

    function _saltedCallData(bytes32 salt, bytes calldata callData) internal pure returns (bytes32) {
        // Scope salt to the callData to avoid front-running the salt with a different callData
        return keccak256(abi.encodePacked(salt, callData));
    }
}
