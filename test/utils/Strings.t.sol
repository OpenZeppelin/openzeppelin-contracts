// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract StringsTest is Test {
    using Strings for *;

    function testParse(uint256 value) external pure {
        assertEq(value, value.toString().parseUint());
    }

    function testParseSigned(int256 value) external pure {
        assertEq(value, value.toStringSigned().parseInt());
    }

    function testParseHex(uint256 value) external pure {
        assertEq(value, value.toHexString().parseHexUint());
    }

    function testParseChecksumHex(address value) external pure {
        assertEq(value, value.toChecksumHexString().parseAddress());
    }
}
