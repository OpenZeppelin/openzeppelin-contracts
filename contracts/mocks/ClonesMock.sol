// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../proxy/Clones.sol";
import "../utils/Address.sol";

contract ClonesMock {
    using Address for address;
    using Clones for address;

    event NewInstance(address instance);

    function clone(address master, bytes calldata initdata) public payable {
        _initAndEmit(master.clone(), initdata);
    }

    function cloneDeterministic(address master, bytes32 salt, bytes calldata initdata) public payable {
        _initAndEmit(master.cloneDeterministic(salt), initdata);
    }

    function predictDeterministicAddress(address master, bytes32 salt) public view returns (address predicted) {
        return master.predictDeterministicAddress(salt);
    }

    function _initAndEmit(address instance, bytes memory initdata) private {
        if (initdata.length > 0) {
            instance.functionCallWithValue(initdata, msg.value);
        }
        emit NewInstance(instance);
    }
}
