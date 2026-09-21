// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Base58} from "@openzeppelin/contracts/utils/Base58.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract Base58Test is Test {
    function testEncodeDecodeEmpty() external pure {
        assertEq(Base58.decode(Base58.encode(hex"")), hex"");
    }

    function testEncodeDecodeZeros() external pure {
        bytes memory zeros = hex"0000000000000000";
        assertEq(Base58.decode(Base58.encode(zeros)), zeros);

        bytes memory almostZeros = hex"00000000a400000000";
        assertEq(Base58.decode(Base58.encode(almostZeros)), almostZeros);
    }

    function testEncodeDecode(bytes memory input) external pure {
        assertEq(Base58.decode(Base58.encode(input)), input);
    }

    function testTryDecode(bytes memory input) external pure {
        (bool success, bytes memory output) = Base58.tryDecode(Base58.encode(input));
        assertTrue(success);
        assertEq(output, input);
    }

    function testTryDecodeInvalid() external pure {
        // 'I' is not part of the Base58 alphabet.
        (bool success, bytes memory output) = Base58.tryDecode("SzIVj");
        assertFalse(success);
        assertEq(output, hex"");
    }

    function testTryDecodeInvalidRestoresFreeMemoryPointer(bytes memory input) external pure {
        bytes memory buf = bytes.concat(hex"0000", input); // Prepend two 0x00 (outside Base58 alphabet)

        Memory.Pointer fmpBefore = Memory.getFreeMemoryPointer();
        (bool success, bytes memory output) = Base58.tryDecode(string(buf));
        Memory.Pointer fmpAfter = Memory.getFreeMemoryPointer();

        assertFalse(success);
        assertEq(output, hex"");
        assertEq(Memory.Pointer.unwrap(fmpAfter), Memory.Pointer.unwrap(fmpBefore));
    }
}
