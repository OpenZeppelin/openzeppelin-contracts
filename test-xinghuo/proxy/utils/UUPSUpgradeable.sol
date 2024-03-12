pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "../../../openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Utils} from "../../../openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {Proxy} from "../../../openzeppelin-contracts/contracts/proxy/Proxy.sol";

contract MyUUPSUpgradeableA is UUPSUpgradeable {

    function _authorizeUpgrade(address newImplementation) internal override {
        //关于合约升级权限的一些控制，比如升级调用者为指定合约地址
    }

    function testA() public returns(bool) {
        return true;
    }
}

contract MyUUPSUpgradeableB is UUPSUpgradeable {

    function _authorizeUpgrade(address newImplementation) internal override {
        //关于合约升级权限的一些控制，比如升级调用者为指定合约地址
    }

    function testB() public returns(bool) {
        return false;
    }
}

//部署时MyUUPSUpgradeableA为逻辑合约；后续升级过程中，通过调用MyProxy.upgradeToAndCall会根据fallback逻辑，调用到MyUUPSUpgradeableA.upgradeToAndCall将逻辑合约更新为MyUUPSUpgradeableB
contract MyProxy is Proxy {
    address public add;
    constructor() {
        add = address(new MyUUPSUpgradeableA());
        bytes memory data = abi.encodeWithSelector(MyUUPSUpgradeableA.testA.selector);
        ERC1967Utils.upgradeToAndCall(add, data);
    }
    
    function _implementation() internal view override returns (address) {
        return add;
    }

    //upgradeToAndCall
}