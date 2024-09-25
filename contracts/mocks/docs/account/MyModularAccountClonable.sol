// contracts/MyModularAccountClonable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MODULE_TYPE_VALIDATOR} from "../../../interfaces/IERC7579Module.sol";
import {Initializable} from "../../../proxy/utils/Initializable.sol";
import {AccountERC7579} from "../../../account/AccountERC7579.sol";
import {Clones} from "../../../proxy/Clones.sol";

contract MyModularAccountClonable is AccountERC7579, Initializable {
    // Make the account initializable and install a validator module
    function setUp(address module, bytes memory moduleInitData) public initializer {
        _installModule(MODULE_TYPE_VALIDATOR, module, moduleInitData);
    }
}

contract MyModularAccountClonableFactory {
    using Clones for address;

    // Store the implementation of the account
    address private immutable _accountImplementation = address(new MyModularAccountClonable());

    function predictAddress(bytes32 salt) public view returns (address) {
        return _accountImplementation.predictDeterministicAddress(salt, address(this));
    }

    // Create accounts on demand
    function cloneAndSetup(address module, bytes32 salt, bytes memory moduleData) public returns (address) {
        return _cloneAndSetup(module, salt, moduleData);
    }

    function _cloneAndSetup(address module, bytes32 salt, bytes memory moduleData) internal returns (address) {
        address predicted = predictAddress(salt);
        if (predicted.code.length == 0) {
            assert(predicted == _accountImplementation.cloneDeterministic(salt));
            MyModularAccountClonable(payable(_accountImplementation)).setUp(module, moduleData);
        }
        return predicted;
    }
}
