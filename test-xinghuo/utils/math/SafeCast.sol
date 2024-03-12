pragma solidity ^0.8.20;

import {SafeCast} from "../../../openzeppelin-contracts/contracts/utils/math/SafeCast.sol";


contract MySafeCast {
    function toUint248(uint256 value) public returns(uint248) {
        return SafeCast.toUint248(value);
    }

    function toInt248(int256 value) public returns(int248) {
        return SafeCast.toInt248(value);
    }
}