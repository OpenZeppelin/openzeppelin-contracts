// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract StringsTest is Test {
    using Strings for *;

    function testParse(uint256 value) external {
        assertEq(value, value.toString().toUint());
    }

    function testParseSigned(int256 value) external {
        assertEq(value, value.toStringSigned().toInt());
    }

    function testParseHex(uint256 value) external {
        assertEq(value, value.toHexString().hexToUint());
    }

    function testParseChecksumHex(address value) external {
        assertEq(value, address(uint160(value.toChecksumHexString().hexToUint())));
    }
}
