pragma solidity ^0.8.20;

import {SignedMath} from "../../../openzeppelin-contracts/contracts/utils/math/SignedMath.sol";


contract MySignedMath {
    function max(int256 a, int256 b) public returns (int256) {
        return SignedMath.max(a, b);
    }

    function min(int256 a, int256 b) public returns (int256) {
        return SignedMath.min(a, b);
    }

    function average(int256 a, int256 b) public returns (int256) {
        return SignedMath.average(a, b);
    }

    function abs(int256 n) public returns (uint256) {
        return SignedMath.abs(n);
    }
}