// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {BeaconProxy} from "../../proxy/beacon/BeaconProxy.sol";

contract BeaconProxyUnsafe is BeaconProxy {
    constructor(address beacon, bytes memory data) payable BeaconProxy(beacon, data) {}

    function _unsafeAllowUninitialized() internal pure override returns (bool) {
        return true;
    }
}
