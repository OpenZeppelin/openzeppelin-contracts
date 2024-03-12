pragma solidity ^0.8.20;

import {Math} from "../../../openzeppelin-contracts/contracts/utils/math/Math.sol";

contract MyMath {
    function tryAdd(uint256 a, uint256 b) public returns(bool, uint256){
        return Math.tryAdd(a, b);
    }

    function trySub(uint256 a, uint256 b) public returns(bool, uint256){
        return Math.trySub(a, b);
    }

    function tryMul(uint256 a, uint256 b) public returns(bool, uint256){
        return Math.tryMul(a, b);
    }

    function tryDiv(uint256 a, uint256 b) public returns(bool, uint256){
        return Math.tryDiv(a, b);
    }

    function tryMod(uint256 a, uint256 b) public returns(bool, uint256){
        return Math.tryMod(a, b);
    }

    function max(uint256 a, uint256 b) public returns(uint256){
        return Math.max(a, b);
    }

    function min(uint256 a, uint256 b) public returns(uint256){
        return Math.min(a, b);
    }

    function average(uint256 a, uint256 b) public returns(uint256){
        return Math.average(a, b);
    }

    function ceilDiv(uint256 a, uint256 b) public returns(uint256){
        return Math.ceilDiv(a, b);
    }
    // a * b / denominator
    function mulDiv(uint256 a, uint256 b, uint256 denominator) public returns(uint256){
        return Math.mulDiv(a, b, denominator);
    }

    function mulDiv(uint256 a, uint256 b, uint256 denominator, uint8 r) public returns(uint256){
        return Math.mulDiv(a, b, denominator, Math.Rounding(r));
    }

    function sqrt(uint256 a) public returns(uint256){
        return Math.sqrt(a);
    }

    function sqrt(uint256 a, uint8 r) public returns(uint256){
        return Math.sqrt(a);
    }

    function log2(uint256 a) public returns(uint256){
        return Math.log2(a);
    }

    function log2(uint256 a, uint8 r) public returns(uint256){
        return Math.log2(a);
    }

    function log10(uint256 a) public returns(uint256){
        return Math.log10(a);
    }

    function log10(uint256 a, uint8 r) public returns(uint256){
        return Math.log10(a);
    }

    function log256(uint256 a) public returns(uint256){
        return Math.log256(a);
    }

    function log256(uint256 a, uint8 r) public returns(uint256){
        return Math.log256(a);
    }

    function unsignedRoundsUp(uint8 r) public returns(bool){
        return Math.unsignedRoundsUp(Math.Rounding(r));
    }
}
