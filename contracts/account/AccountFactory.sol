// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../proxy/Clones.sol";

abstract contract AccountFactory {
    using Clones for address;

    address internal immutable _accountImplementation;

    constructor(address accountImplementation) {
        _accountImplementation = accountImplementation;
    }

    function clone(bytes memory args, bytes32 salt) external virtual returns (address);

    function predictAddress(bytes memory args, bytes32 salt) public view returns (address) {
        return _accountImplementation.predictDeterministicAddressWithImmutableArgs(args, salt);
    }

    function _clone(bytes memory args, bytes32 salt) internal returns (address) {
        address predicted = predictAddress(args, salt);
        if (predicted.code.length == 0) _accountImplementation.cloneDeterministicWithImmutableArgs(args, salt);
        return predicted;
    }
}
