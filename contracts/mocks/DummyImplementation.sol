// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC1967Utils} from "../proxy/ERC1967/ERC1967Utils.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";

abstract contract Impl {
    function version() public pure virtual returns (string memory);
}

contract DummyImplementation {
    uint256 public value;
    string public text;
    uint256[] public values;

    function initializeNonPayable() public {
        value = 10;
    }

    function initializePayable() public payable {
        value = 100;
    }

    function initializeNonPayableWithValue(uint256 _value) public {
        value = _value;
    }

    function initializePayableWithValue(uint256 _value) public payable {
        value = _value;
    }

    function initialize(uint256 _value, string memory _text, uint256[] memory _values) public {
        value = _value;
        text = _text;
        values = _values;
    }

    function get() public pure returns (bool) {
        return true;
    }

    function version() public pure virtual returns (string memory) {
        return "V1";
    }

    function reverts() public pure {
        require(false, "DummyImplementation reverted");
    }

    // Use for forcing an unsafe TransparentUpgradeableProxy admin override
    function unsafeOverrideAdmin(address newAdmin) public {
        StorageSlot.getAddressSlot(ERC1967Utils.ADMIN_SLOT).value = newAdmin;
    }
}

contract DummyImplementationV2 is DummyImplementation {
    function migrate(uint256 newVal) public payable {
        value = newVal;
    }

    function version() public pure override returns (string memory) {
        return "V2";
    }
}
