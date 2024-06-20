// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract StringsTest is Test {
    function testStringUint256(uint256 value) public {
        string memory actual = Strings.toString(value);
        assertEq(actual, vm.toString(value));
    }

    function testStringInt256(int256 value) public {
        string memory actual = Strings.toStringSigned(value);
        assertEq(actual, vm.toString(value));
    }

    function testHexStringUint256(uint256 value) public {
        string memory actual = vm.replace(Strings.toHexString(value), "0", "");
        string memory expected = vm.replace(vm.toString(bytes32(value)), "0", "");
        assertEq(actual, expected);
    }

    function testHexStringAddress(address value) public {
        string memory actual = Strings.toHexString(value);
        assertEq(actual, vm.toLowercase(vm.toString(value)));
    }

    function testChecksumHexStringAddress(address value) public {
        string memory actual = Strings.toChecksumHexString(value);
        assertEq(actual, vm.toString(value));
    }
}
