// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../interfaces/IERC1967.sol";
import "../utils/StorageSlot.sol";

abstract contract Impl {
    function version() public pure virtual returns (string memory);
}

contract DummyImplementation {
    uint256 public value;
    string public text;
    uint256[] public values;

    // bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
    bytes32 internal constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

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
    function _unsafeOverrideAdmin(address newAdmin) public {
        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;
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
