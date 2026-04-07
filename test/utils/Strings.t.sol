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

    function testEscapeJSONLength(string memory input) external pure {
        assertGe(bytes(input.escapeJSON()).length, bytes(input).length);
    }

    // Validates the output of escapeJSON is well-formed JSON string content:
    // - no unescaped control characters (U+0000 to U+001F)
    // - no unescaped double quotes
    // - every backslash begins a valid escape sequence (\b \t \n \f \r \\ \" or \u00XX)
    function testEscapeJSON(string memory input) external pure {
        bytes memory escaped = bytes(input.escapeJSON());

        for (uint256 i = 0; i < escaped.length; i++) {
            uint8 c = uint8(escaped[i]);
            assertGe(c, 0x20);

            if (c == 0x5c) {
                assertLt(i + 1, escaped.length);
                uint8 next = uint8(escaped[++i]);
                if (next == 0x75) {
                    // \u00XX
                    assertLt(i + 4, escaped.length);
                    assertEq(uint8(escaped[i + 1]), 0x30);
                    assertEq(uint8(escaped[i + 2]), 0x30);
                    i += 4;
                } else {
                    assertTrue(
                        next == 0x62 || // \b
                        next == 0x74 || // \t
                        next == 0x6e || // \n
                        next == 0x66 || // \f
                        next == 0x72 || // \r
                        next == 0x5c || // \\
                        next == 0x22    // \"
                    );
                }
            } else {
                assertTrue(c != 0x22);
            }
        }
    }
}
