pragma solidity ^0.8.20;

import {BeaconProxy} from "../../../openzeppelin-contracts/contracts/proxy/beacon/BeaconProxy.sol";
import {IBeacon} from "../../../openzeppelin-contracts/contracts/proxy/beacon/IBeacon.sol";

contract TestContract {
    function test() public returns(uint256) {
        return 100;
    }
}

contract Beacon is IBeacon{
    address public add;
    constructor() {
        add = address(new TestContract());
    }
    function implementation() external view returns (address) {
        return add;
    }
}

contract MyBeaconProxy is BeaconProxy {

    constructor(address implementation_, bytes memory data) BeaconProxy(implementation_, data) {

    }

    function Implementation() public returns(address) {
        return _implementation();
    }

    function GetBeacon() public returns(address) {
        return _getBeacon();
    }
    
}