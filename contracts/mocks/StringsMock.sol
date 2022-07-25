// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Strings.sol";

contract StringsMock {
    function toString(uint256 value) public pure returns (string memory) {
        return Strings.toString(value);
    }

    function toHexString(uint256 value) public pure returns (string memory) {
        return Strings.toHexString(value);
    }

    function toHexString(uint256 value, uint256 length) public pure returns (string memory) {
        return Strings.toHexString(value, length);
    }

    function toHexString(address addr) public pure returns (string memory) {
        return Strings.toHexString(addr);
    }
}
