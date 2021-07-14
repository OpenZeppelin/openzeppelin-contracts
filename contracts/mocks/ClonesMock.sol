// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/Clones.sol";
import "../utils/Address.sol";

contract ClonesMock {
    using Address for address;
    using Clones for address;

    event NewInstance(address instance);

    function clone(address implementation, bytes calldata initdata) public payable {
        _initAndEmit(implementation.clone(), initdata);
    }

    function cloneDeterministic(
        address implementation,
        bytes32 salt,
        bytes calldata initdata
    ) public payable {
        _initAndEmit(implementation.cloneDeterministic(salt), initdata);
    }

    function predictDeterministicAddress(address implementation, bytes32 salt) public view returns (address predicted) {
        return implementation.predictDeterministicAddress(salt);
    }

    function _initAndEmit(address instance, bytes memory initdata) private {
        if (initdata.length > 0) {
            instance.functionCallWithValue(initdata, msg.value);
        }
        emit NewInstance(instance);
    }
}
