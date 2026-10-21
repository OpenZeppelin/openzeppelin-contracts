// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/Calldata.t.sol.eta.

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Calldata} from "@openzeppelin/contracts/utils/Calldata.sol";

contract CalldataTest is Test {
    function testEmptyString() external pure {
        assertEq(bytes(Calldata.emptyString()).length, 0);
        assertEq(abi.encode(Calldata.emptyString()), abi.encode(string("")));
    }

    function testEmptyBytes() external pure {
        assertEq(bytes(Calldata.emptyBytes()).length, 0);
        assertEq(abi.encode(Calldata.emptyBytes()), abi.encode(bytes("")));
    }

    function testEmptyAddressArray() external pure {
        assertEq(Calldata.emptyAddressArray().length, 0);
        assertEq(abi.encode(Calldata.emptyAddressArray()), abi.encode(new address[](0)));
    }

    function testEmptyBooleanArray() external pure {
        assertEq(Calldata.emptyBooleanArray().length, 0);
        assertEq(abi.encode(Calldata.emptyBooleanArray()), abi.encode(new bool[](0)));
    }

    function testEmptyBytes32Array() external pure {
        assertEq(Calldata.emptyBytes32Array().length, 0);
        assertEq(abi.encode(Calldata.emptyBytes32Array()), abi.encode(new bytes32[](0)));
    }

    function testEmptyUint256Array() external pure {
        assertEq(Calldata.emptyUint256Array().length, 0);
        assertEq(abi.encode(Calldata.emptyUint256Array()), abi.encode(new uint256[](0)));
    }

    function testEmptyInt256Array() external pure {
        assertEq(Calldata.emptyInt256Array().length, 0);
        assertEq(abi.encode(Calldata.emptyInt256Array()), abi.encode(new int256[](0)));
    }

    function testEmptyStringArray() external pure {
        assertEq(Calldata.emptyStringArray().length, 0);
        assertEq(abi.encode(Calldata.emptyStringArray()), abi.encode(new string[](0)));
    }

    function testEmptyBytesArray() external pure {
        assertEq(Calldata.emptyBytesArray().length, 0);
        assertEq(abi.encode(Calldata.emptyBytesArray()), abi.encode(new bytes[](0)));
    }
}
