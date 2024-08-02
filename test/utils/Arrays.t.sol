// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";

contract ArraysTest is Test, SymTest {
    function testSort(uint256[] memory values) public pure {
        Arrays.sort(values);
        _assertSort(values);
    }

    function symbolicSort() public pure {
        uint256[] memory values = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            values[i] = svm.createUint256("arrayElement");
        }
        Arrays.sort(values);
        _assertSort(values);
    }

    /// Asserts

    function _assertSort(uint256[] memory values) internal pure {
        for (uint256 i = 1; i < values.length; ++i) {
            assertLe(values[i - 1], values[i]);
        }
    }
}
