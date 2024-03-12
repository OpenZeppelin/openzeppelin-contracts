pragma solidity ^0.8.20;

import {TransparentUpgradeableProxy} from "../../../openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract TestContract {
    function testA(bool ret) public returns(bool) {
        return ret;
    }

    function testB() public returns(uint256) {
        return 122;
    }
}

contract MyTransparentUpgradeableProxy is TransparentUpgradeableProxy{
    //构建合约执行testB接口；构建完成后，调用testA接口
    constructor(address _logic, address initialOwner, bytes memory _data) TransparentUpgradeableProxy(_logic, initialOwner, _data) {

    }

    function proxyAdmin() public returns(address) {
        return _proxyAdmin();
    }
    
}