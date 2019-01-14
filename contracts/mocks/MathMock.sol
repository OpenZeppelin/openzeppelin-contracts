pragma solidity ^0.5.0;

import "../math/Math.sol";

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
}
