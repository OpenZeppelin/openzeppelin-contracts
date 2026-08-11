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
            assertEq(output, abi.decode(buffer, (bytes)));
        } else {
            assertEq(output, new bytes(0));
        }
    }

    function testDecodeDegenerateCase() public view {
        bytes memory buffer = abi.encodePacked(uint256(0x00)); // offset to itself + length = 0

        (bool success, Memory.Slice output) = buffer.tryDecodeBytes();
        assertTrue(success);
        assertEq(output.toBytes(), new bytes(0));

        (bool successCalldata, bytes memory outputCalldata) = this.__tryDecodeBytesCalldata(buffer);
        assertTrue(successCalldata);
        assertEq(outputCalldata, new bytes(0));
    }

    function testDecodeOutOfBoundOffset() public view {
        bytes memory buffer = abi.encodePacked(uint256(0x20));

        (bool success, Memory.Slice output) = buffer.tryDecodeBytes();
        assertFalse(success);
        assertEq(output.toBytes(), new bytes(0));

        (bool successCalldata, bytes memory outputCalldata) = this.__tryDecodeBytesCalldata(buffer);
        assertFalse(successCalldata);
        assertEq(outputCalldata, new bytes(0));
    }

    function testDecodeLengthExceedsBuffer() public view {
        bytes memory buffer = abi.encodePacked(uint256(0x20), uint256(0x40));

        (bool success, Memory.Slice output) = buffer.tryDecodeBytes();
        assertFalse(success);
        assertEq(output.toBytes(), new bytes(0));

        (bool successCalldata, bytes memory outputCalldata) = this.__tryDecodeBytesCalldata(buffer);
        assertFalse(successCalldata);
        assertEq(outputCalldata, new bytes(0));
    }

    function __tryDecodeBytesCalldata(
        bytes calldata buffer
    ) external pure returns (bool success, bytes calldata output) {
        return buffer.tryDecodeBytesCalldata();
    }
}
