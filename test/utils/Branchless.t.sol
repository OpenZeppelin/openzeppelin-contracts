// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Branchless.t.sol.eta.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Branchless} from "@openzeppelin/contracts/utils/Branchless.sol";

contract BranchlessTest is Test {
    function testSymbolicTernaryAddress(bool condition, address a, address b) public pure {
        assertEq(Branchless.ternary(condition, a, b), condition ? a : b);
    }

    function testSymbolicTernaryBoolean(bool condition, bool a, bool b) public pure {
        assertEq(Branchless.ternary(condition, a, b), condition ? a : b);
    }

    function testSymbolicTernaryBytes32(bool condition, bytes32 a, bytes32 b) public pure {
        assertEq(Branchless.ternary(condition, a, b), condition ? a : b);
    }

    function testSymbolicTernaryUint256(bool condition, uint256 a, uint256 b) public pure {
        assertEq(Branchless.ternary(condition, a, b), condition ? a : b);
    }

    function testSymbolicTernaryInt256(bool condition, int256 a, int256 b) public pure {
        assertEq(Branchless.ternary(condition, a, b), condition ? a : b);
    }
}
