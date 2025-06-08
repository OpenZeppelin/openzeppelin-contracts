// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";

contract BytesTest is Test {
    function testSymbolicEqual(bytes memory a, bytes memory b) public pure {
        assertEq(Bytes.equal(a, b), Bytes.equal(a, b));
    }
}
