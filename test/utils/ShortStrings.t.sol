// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {ShortStrings, ShortString} from "@openzeppelin/contracts/utils/ShortStrings.sol";

contract ShortStringsTest is Test {
    string _fallback;

    function testRoundtripShort(string memory input) external {
        vm.assume(_isShort(input));
        ShortString short = ShortStrings.toShortString(input);
        string memory output = ShortStrings.toString(short);
        assertEq(input, output);
    }

    function testRoundtripWithFallback(string memory input, string memory fallbackInitial) external {
        _fallback = fallbackInitial; // Make sure that the initial value has no effect
        ShortString short = ShortStrings.toShortStringWithFallback(input, _fallback);
        string memory output = ShortStrings.toStringWithFallback(short, _fallback);
        assertEq(input, output);
    }

    function testRevertLong(string memory input) external {
        vm.assume(!_isShort(input));
        vm.expectRevert(abi.encodeWithSelector(ShortStrings.StringTooLong.selector, input));
        this.toShortString(input);
    }

    function testLengthShort(string memory input) external {
        vm.assume(_isShort(input));
        uint256 inputLength = bytes(input).length;
        ShortString short = ShortStrings.toShortString(input);
        uint256 shortLength = ShortStrings.byteLength(short);
        assertEq(inputLength, shortLength);
    }

    function testLengthWithFallback(string memory input, string memory fallbackInitial) external {
        _fallback = fallbackInitial;
        uint256 inputLength = bytes(input).length;
        ShortString short = ShortStrings.toShortStringWithFallback(input, _fallback);
        uint256 shortLength = ShortStrings.byteLengthWithFallback(short, _fallback);
        assertEq(inputLength, shortLength);
    }

    function toShortString(string memory input) external pure returns (ShortString) {
        return ShortStrings.toShortString(input);
    }

    function _isShort(string memory input) internal pure returns (bool) {
        return bytes(input).length < 32;
    }
}
