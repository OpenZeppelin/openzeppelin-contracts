// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Strings.sol";

contract StringsMock {
    function fromUint256(uint256 value) public pure returns (string memory) {
        return Strings.toString(value);
    }

    function fromUint256Hex(uint256 value) public pure returns (string memory) {
        return Strings.toHexString(value);
    }

    function fromUint256HexFixed(uint256 value, uint256 length) public pure returns (string memory) {
        return Strings.toHexString(value, length);
    }

    function fromAddressHexFixed(address addr) public pure returns (string memory) {
        return Strings.toHexString(addr);
    }
}
