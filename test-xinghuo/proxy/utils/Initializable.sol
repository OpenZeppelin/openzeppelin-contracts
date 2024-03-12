pragma solidity ^0.8.20;

import {Initializable} from "../../../openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";

contract MyInitializable is Initializable{
    bool public initFlag;
    uint64 public version;
    //第一次调用成功，第二次调用revert:f92ee8a9
    function init() public initializer() {
        initFlag = true;
        version = 0;
    }

    //只有在init/update中能调用，直接调用updateVersion revert:d7e6bcf8
    function updateVersion(uint64 ver) public onlyInitializing() {
        version = ver;
    }

    function update(uint64 ver) public reinitializer(ver) {
        updateVersion(ver);
    }

    function GetVersion() public returns(uint64) {
        return _getInitializedVersion();
    }

    function isInitializing() public returns(bool) {
        return _isInitializing();
    }

    //调用该方法后，update无法再次调用
    function disableInitializers() public {
        _disableInitializers();
    }
}