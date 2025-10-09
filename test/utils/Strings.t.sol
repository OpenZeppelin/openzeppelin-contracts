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

    function testTryParseHexUintExtendedEnd(string memory random) external pure {
        uint256 length = bytes(random).length;
        assembly ("memory-safe") {
            mstore(add(add(random, 0x20), length), 0x3030303030303030303030303030303030303030303030303030303030303030)
        }

        (bool success, ) = random.tryParseHexUint(1, length + 1);
        assertFalse(success);
    }

    function testTryParseAddressExtendedEnd(address random, uint256 begin) external pure {
        begin = bound(begin, 3, 43);
        string memory input = random.toHexString();
        uint256 length = bytes(input).length;

        assembly ("memory-safe") {
            mstore(add(add(input, 0x20), length), 0x3030303030303030303030303030303030303030303030303030303030303030)
        }

        (bool success, ) = input.tryParseAddress(begin, begin + 40);
        assertFalse(success);
    }
}
