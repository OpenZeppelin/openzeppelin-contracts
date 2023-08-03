// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBeacon} from "../proxy/beacon/IBeacon.sol";

contract UpgradeableBeaconMock is IBeacon {
    address public implementation;

    constructor(address impl) {
        implementation = impl;
    }
}
