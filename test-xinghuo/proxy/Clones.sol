pragma solidity ^0.8.20;

import {Clones} from "../../openzeppelin-contracts/contracts/proxy/Clones.sol";

contract TestContract {
    function testA(bool ret) public returns(bool) {
        return ret;
    }
}

contract MyClones {
    address public add;
    constructor() {
        add = address(new TestContract());
    }
    
    function clone() public returns(address) {
        return Clones.clone(address(add));
    }

    function cloneDeterministic() public returns(address) {
        bytes32 salt = 0x9700def5a0ee4e2cb712ce27fddcf0ba5e437006933f4de0c23e75afa497bcd9;
        return Clones.cloneDeterministic(address(add), salt);
    }

    //该接口生成地址与cloneDeterministic接口生成地址相同
    function predictDeterministicAddress() public returns(address) {
        bytes32 salt = 0x9700def5a0ee4e2cb712ce27fddcf0ba5e437006933f4de0c23e75afa497bcd9;
        return Clones.predictDeterministicAddress(address(add), salt);
    }

}