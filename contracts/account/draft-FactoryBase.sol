// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../proxy/Clones.sol";
import {Address} from "../utils/Address.sol";

/**
 * @dev An abstract factory contract to create {Initializable} contract clones on demand.
 *
 * In the context of ERC-4337, this contract can be used to create accounts.
 */
abstract contract FactoryBase {
    using Clones for address;

    // Store the implementation of the account
    address private immutable _impl;

    /**
     * @dev Initializes the factory with the implementation of the account.
     *
     * IMPORTANT: The implementation must have an initializer function. We recommend using
     * {Initializable} for this purpose.
     */
    constructor(address impl) {
        _impl = impl;
    }

    /// @dev Predict the address of a clone
    function predictAddress(bytes32 salt) public view returns (address) {
        return _impl.predictDeterministicAddress(salt, address(this));
    }

    /// @dev Create clones on demand
    function cloneAndInitialize(bytes32 salt, bytes calldata data) public returns (address) {
        return _cloneAndInitialize(salt, data);
    }

    /// @dev Create clones on demand and return the address. Uses `data` to initialize the clone.
    function _cloneAndInitialize(bytes32 salt, bytes calldata data) internal returns (address) {
        address predicted = predictAddress(salt);
        if (predicted.code.length == 0) {
            _impl.cloneDeterministic(salt);
            Address.functionCall(predicted, data);
        }
        return predicted;
    }
}
