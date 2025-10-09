// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Base58} from "@openzeppelin/contracts/utils/Base58.sol";

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
}
