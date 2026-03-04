// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AbiDecode} from "@openzeppelin/contracts/utils/AbiDecode.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract AbiDecodeTest is Test {
    using AbiDecode for *;
    using Memory for *;

    function testDecode(bytes memory buffer) public pure {
        (bool success, Memory.Slice output) = abi.encode(buffer).tryDecodeBytes();
        assertTrue(success);
        assertEq(output.toBytes(), buffer);
    }

    function testDecodeNoRevert(bytes memory buffer) public pure {
        (bool success, Memory.Slice output) = buffer.tryDecodeBytes();
        if (success) {
            assertEq(output.toBytes(), abi.decode(buffer, (bytes)));
        } else {
            assertEq(output.toBytes(), new bytes(0));
        }
    }

    function testDecodeCalldata(bytes memory buffer) public view {
        (bool success, bytes memory output) = this.__tryDecodeBytesCalldata(abi.encode(buffer));
        assertTrue(success);
        assertEq(output, buffer);
    }

    function testDecodeCalldataNoRevert(bytes calldata buffer) public pure {
        (bool success, bytes calldata output) = buffer.tryDecodeBytesCalldata();
        if (success) {
            assertEq(output, new bytes(0));
        } else {
            assertEq(output, new bytes(0));
        }
    }

    function __tryDecodeBytesCalldata(
        bytes calldata buffer
    ) external pure returns (bool success, bytes calldata output) {
        return buffer.tryDecodeBytesCalldata();
    }
}
