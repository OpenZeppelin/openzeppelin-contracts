// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";

contract ArraysTest is Test {
    function testSort(uint256[] memory values) public {
        Arrays.sort(values);
        for (uint256 i = 1; i < values.length; ++i) {
            assertLe(values[i - 1], values[i]);
        }
    }
}
