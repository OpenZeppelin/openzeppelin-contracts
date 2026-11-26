// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {BeaconProxy} from "../../proxy/beacon/BeaconProxy.sol";

contract BeaconProxyUnsafe is BeaconProxy {
    constructor(address beacon, bytes memory data) payable BeaconProxy(beacon, data) {}

    function _unsafeAllowUninitialized() internal pure override returns (bool) {
        return true;
    }
}
