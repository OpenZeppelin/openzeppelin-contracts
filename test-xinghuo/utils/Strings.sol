pragma solidity ^0.8.20;

import {Strings} from "../../openzeppelin-contracts/contracts/utils/Strings.sol";

contract MyStrings{
	function toString(uint256 value) public returns(string memory){
		return Strings.toString(value);
	}

    function toStringSigned(int256 value) public returns(string memory){
        return Strings.toStringSigned(value);
    }

    function toHexString(uint256 value) public returns(string memory){
        return Strings.toHexString(value);
    }

    function toHexString(uint256 value, uint256 length) public returns(string memory){
        return Strings.toHexString(value, length);
    }

    function toHexString(address add) public returns(string memory) {
        return Strings.toHexString(add);
    }

    function equal(string memory a, string memory b) public returns(bool) {
        return Strings.equal(a, b);
    }
}
