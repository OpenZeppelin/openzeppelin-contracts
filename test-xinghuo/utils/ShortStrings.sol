pragma solidity ^0.8.20;

import {ShortString} from "../../openzeppelin-contracts/contracts/utils/ShortStrings.sol";
import {ShortStrings} from "../../openzeppelin-contracts/contracts/utils/ShortStrings.sol";


contract MyShortStrings{
    string strstr;
    function toShortString(string memory str) public returns(ShortString) {
        return ShortStrings.toShortString(str);
    }

    function toString(ShortString str) public returns(string memory) {
        return ShortStrings.toString(str);
    }

    function byteLength(ShortString str) public returns(uint256) {
        return ShortStrings.byteLength(str);
    }

    function toShortStringWithFallback(string memory str) public returns(ShortString) {
        return ShortStrings.toShortStringWithFallback(str, strstr);
    }

    function toStringWithFallback(ShortString str) public returns(string memory) {
        return ShortStrings.toStringWithFallback(str, strstr);
    }

    function byteLengthWithFallback(ShortString str) public returns(uint256) {
        return ShortStrings.byteLengthWithFallback(str, strstr);
    }
}
