pragma solidity ^0.8.20;

import {ERC1967Proxy} from "../../../openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TestContractA {
    uint256 val;
    function test() public {
        val = 1;
    }
}

contract MyERC1967Proxy {
    TestContractA public addA;
    ERC1967Proxy public proxy;
    constructor() {
        addA = new TestContractA();
    }
    //调用buildProxy后，即可根据返回地址调用TestContractA合约
    function buildProxy() public returns(address) {
        bytes memory data = abi.encodeWithSelector(TestContractA.test.selector);

        ERC1967Proxy proxy = new ERC1967Proxy(address(addA), data);
        return address(proxy);
    }
}