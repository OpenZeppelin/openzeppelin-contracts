// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC7930} from "../../contracts/utils/ERC7930.sol";

contract ERC7930Test is Test {
    using ERC7930 for bytes;

    function testFormatParse(bytes2 chainType, bytes calldata chainReference, bytes calldata addr) public view {
        vm.assume(chainReference.length > 0 || addr.length > 0);
        {
            (bytes2 chainType_, bytes memory chainReference_, bytes memory addr_) = ERC7930
                .formatV1(chainType, chainReference, addr)
                .parseV1();
            assertEq(chainType, chainType_);
            assertEq(chainReference, chainReference_);
            assertEq(addr, addr_);
        }
        {
            (bool success, bytes2 chainType_, bytes memory chainReference_, bytes memory addr_) = ERC7930
                .formatV1(chainType, chainReference, addr)
                .tryParseV1();
            assertTrue(success);
            assertEq(chainType, chainType_);
            assertEq(chainReference, chainReference_);
            assertEq(addr, addr_);
        }
        {
            (bytes2 chainType_, bytes memory chainReference_, bytes memory addr_) = this.parseV1Calldata(
                ERC7930.formatV1(chainType, chainReference, addr)
            );
            assertEq(chainType, chainType_);
            assertEq(chainReference, chainReference_);
            assertEq(addr, addr_);
        }
        {
            (bool success, bytes2 chainType_, bytes memory chainReference_, bytes memory addr_) = this
                .tryParseV1Calldata(ERC7930.formatV1(chainType, chainReference, addr));
            assertTrue(success);
            assertEq(chainType, chainType_);
            assertEq(chainReference, chainReference_);
            assertEq(addr, addr_);
        }
    }

    function parseV1Calldata(
        bytes calldata self
    ) external pure returns (bytes2 chainType, bytes calldata chainReference, bytes calldata addr) {
        return self.parseV1Calldata();
    }

    function tryParseV1Calldata(
        bytes calldata self
    ) external pure returns (bool success, bytes2 chainType, bytes calldata chainReference, bytes calldata addr) {
        return self.tryParseV1Calldata();
    }
}
