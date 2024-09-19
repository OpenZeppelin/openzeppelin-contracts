// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Clones} from "../proxy/Clones.sol";

abstract contract AccountFactory {
    using Clones for address;

    address internal immutable _accountImplementation;

    function predictAddress(bytes memory encodedSigner, bytes32 salt) public view returns (address) {
        return _accountImplementation.predictDeterministicAddressWithImmutableArgs(encodedSigner, salt);
    }

    function _clone(bytes memory encodedSigner, bytes32 salt) internal returns (address) {
        address predicted = predictAddress(encodedSigner, salt);
        if (predicted.code.length == 0) {
            _accountImplementation.cloneDeterministicWithImmutableArgs(encodedSigner, salt);
        }
        return predicted;
    }
}
