pragma solidity ^0.8.20;

import {Address} from "../../openzeppelin-contracts/contracts/utils/Address.sol";

contract MyAddress {
    function test() public payable returns(string memory) {
        return "hello world"; 
    }

    function sendValue() public {
        Address.sendValue(payable(address(this)), 1);
    }

    function functionCall() public {
        bytes memory data = abi.encodeWithSelector(this.test.selector);
        Address.functionCall(payable(address(this)), data);
    }

    function functionCallWithValue() public {
        bytes memory data = abi.encodeWithSelector(this.test.selector);
        Address.functionCallWithValue(payable(address(this)), data, 1);
    }

    function functionStaticCall() public returns(bytes memory) {
        bytes memory data = abi.encodeWithSelector(this.test.selector);
        return Address.functionStaticCall(payable(address(this)), data);
    }

    function functionDelegateCall() public returns(bytes memory) {
        bytes memory data = abi.encodeWithSelector(this.test.selector);
        return Address.functionDelegateCall(payable(address(this)), data);
    }
}