pragma solidity ^0.8.20;

import {Proxy} from "../../openzeppelin-contracts/contracts/proxy/Proxy.sol";

contract TestContract {
    function testA(bool ret) public returns(bool) {
        return ret;
    }
}

contract MyProxy is Proxy{
    //直接基于MyProxy合约地址调用合约TestContract.testA(ret);，该合约会调用fallback函数找到testA并进行delegateCall调用
    address public add;
    constructor() {
        add = address(new TestContract());
    }
    
    function _implementation() internal view override returns (address) {
        return add;
    }
}