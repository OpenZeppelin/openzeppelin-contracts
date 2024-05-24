// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";

import {ShortStrings, ShortString} from "@openzeppelin/contracts/utils/ShortStrings.sol";

contract ShortStringsTest is Test, SymTest {
    string _fallback;

    function testRoundtripShort(string memory input) external {
        vm.assume(_isShort(input));
        _assertRoundtripShort(input);
    }

    function symbolicRoundtripShort() external {
        string memory input = svm.createString(31, "RoundtripShortInput");
        _assertRoundtripShort(input);
    }

    function testRoundtripWithFallback(string memory input, string memory fallbackInitial) external {
        _assertRoundtripWithFallback(input, fallbackInitial);
    }

    function symbolicRoundtripWithFallbackLong() external {
        string memory input = svm.createString(256, "RoundtripWithFallbackInput");
        string memory fallbackInitial = svm.createString(256, "RoundtripWithFallbackFallbackInitial");
        _assertRoundtripWithFallback(input, fallbackInitial);
    }

    function symbolicRoundtripWithFallbackShort() external {
        string memory input = svm.createString(31, "RoundtripWithFallbackInput");
        string memory fallbackInitial = svm.createString(31, "RoundtripWithFallbackFallbackInitial");
        _assertRoundtripWithFallback(input, fallbackInitial);
    }

    function testRevertLong(string memory input) external {
        vm.assume(!_isShort(input));
        _assertRevertLong(input);
    }

    function testLengthShort(string memory input) external {
        vm.assume(_isShort(input));
        _assertLengthShort(input);
    }

    function symbolicLengthShort() external {
        string memory input = svm.createString(31, "LengthShortInput");
        _assertLengthShort(input);
    }

    function testLengthWithFallback(string memory input, string memory fallbackInitial) external {
        _fallback = fallbackInitial;
        _assertLengthWithFallback(input);
    }

    function symbolicLengthWithFallback() external {
        uint256 length = 256;
        string memory input = svm.createString(length, "LengthWithFallbackInput");
        string memory fallbackInitial = svm.createString(length, "LengthWithFallbackFallbackInitial");
        _fallback = fallbackInitial;
        _assertLengthWithFallback(input);
    }

    /// Assertions

    function _assertRoundtripShort(string memory input) internal {
        ShortString short = ShortStrings.toShortString(input);
        string memory output = ShortStrings.toString(short);
        assertEq(input, output);
    }

    function _assertRoundtripWithFallback(string memory input, string memory fallbackInitial) internal {
        _fallback = fallbackInitial; // Make sure that the initial value has no effect
        ShortString short = ShortStrings.toShortStringWithFallback(input, _fallback);
        string memory output = ShortStrings.toStringWithFallback(short, _fallback);
        assertEq(input, output);
    }

    function _assertRevertLong(string memory input) internal {
        vm.expectRevert(abi.encodeWithSelector(ShortStrings.StringTooLong.selector, input));
        this.toShortString(input);
    }

    function _assertLengthShort(string memory input) internal {
        ShortString short = ShortStrings.toShortString(input);
        uint256 shortLength = ShortStrings.byteLength(short);
        uint256 inputLength = bytes(input).length;
        assertEq(inputLength, shortLength);
    }

    function _assertLengthWithFallback(string memory input) internal {
        uint256 inputLength = bytes(input).length;
        ShortString short = ShortStrings.toShortStringWithFallback(input, _fallback);
        uint256 shortLength = ShortStrings.byteLengthWithFallback(short, _fallback);
        assertEq(inputLength, shortLength);
    }

    /// Helpers
    function toShortString(string memory input) external pure returns (ShortString) {
        return ShortStrings.toShortString(input);
    }

    function _isShort(string memory input) internal pure returns (bool) {
        return bytes(input).length < 32;
    }
}
