// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Target {
    uint256 public value;

    function setValue(uint256 _value) external {
        value = _value;
    }

    function getValue() external view returns (uint256) {
        return value;
    }

    function revertFunction() external pure {
        revert("Target: function reverts");
    }
}
