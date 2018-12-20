pragma solidity ^0.5.0;


import "../math/SafeMath.sol";


contract SafeMathMock {
    function mulUints(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.mul(a, b);
    }

    function mulInts(int256 a, int256 b) public pure returns (int256) {
        return SafeMath.mul(a, b);
    }

    function divUints(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.div(a, b);
    }

    function divInts(int256 a, int256 b) public pure returns (int256) {
        return SafeMath.div(a, b);
    }

    function subUints(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.sub(a, b);
    }

    function subInts(int256 a, int256 b) public pure returns (int256) {
        return SafeMath.sub(a, b);
    }

    function addUints(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.add(a, b);
    }

    function addInts(int256 a, int256 b) public pure returns (int256) {
        return SafeMath.add(a, b);
    }

    function modUints(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.mod(a, b);
    }
}
