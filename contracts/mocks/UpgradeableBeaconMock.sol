// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBeacon} from "../proxy/beacon/IBeacon.sol";

contract UpgradeableBeaconMock is IBeacon {
    address public implementation;

    constructor(address impl) {
        implementation = impl;
    }
}

interface IProxyExposed {
    // solhint-disable-next-line func-name-mixedcase
    function $getBeacon() external view returns (address);
}

contract UpgradeableBeaconReentrantMock is IBeacon {
    error BeaconProxyBeaconSlotAddress(address beacon);

    function implementation() external view override returns (address) {
        // Revert with the beacon seen in the proxy at the moment of calling to check if it's
        // set before the call.
        revert BeaconProxyBeaconSlotAddress(IProxyExposed(msg.sender).$getBeacon());
    }
}
