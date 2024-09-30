// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../proxy/Clones.sol";
import {Address} from "../utils/Address.sol";

abstract contract FactoryBase {
    using Clones for address;

    // Store the implementation of the account
    address private immutable _impl;

    constructor(address impl) {
        _impl = impl;
    }

    function predictAddress(bytes32 salt) public view returns (address) {
        return _impl.predictDeterministicAddress(salt, address(this));
    }

    // Create accounts on demand
    function cloneAndInitialize(bytes32 salt, bytes calldata data) public returns (address) {
        return _cloneAndInitialize(salt, data);
    }

    function _cloneAndInitialize(bytes32 salt, bytes calldata data) internal returns (address) {
        address predicted = predictAddress(salt);
        if (predicted.code.length == 0) {
            _impl.cloneDeterministic(salt);
            Address.functionCall(predicted, data);
        }
        return predicted;
    }
}
