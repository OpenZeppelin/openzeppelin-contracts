// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/Math.sol";

contract MathMock {
    function max(uint256 a, uint256 b) public pure returns (uint256) {
        return Math.max(a, b);
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return Math.min(a, b);
    }

    function average(uint256 a, uint256 b) public pure returns (uint256) {
        return Math.average(a, b);
    }

    function ceilDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return Math.ceilDiv(a, b);
    }

    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator,
        Math.Rounding direction
    ) public pure returns (uint256) {
        return Math.mulDiv(a, b, denominator, direction);
    }

    function sqrt(uint256 a, Math.Rounding direction) public pure returns (uint256) {
        return Math.sqrt(a, direction);
    }

    function log2(uint256 a, Math.Rounding direction) public pure returns (uint256) {
        return Math.log2(a, direction);
    }

    function log10(uint256 a, Math.Rounding direction) public pure returns (uint256) {
        return Math.log10(a, direction);
    }

    function log256(uint256 a, Math.Rounding direction) public pure returns (uint256) {
        return Math.log256(a, direction);
    }
}
