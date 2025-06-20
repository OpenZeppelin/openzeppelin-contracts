// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Base58} from "@openzeppelin/contracts/utils/Base58.sol";

contract Base58Test is Test {
    function testEncodeDecodeEmpty() external pure {
        assertEq(Base58.decode(Base58.encode("")), "");
    }

    function testEncodeDecode(bytes memory input) external pure {
        assertEq(Base58.decode(Base58.encode(input)), input);
    }
}
