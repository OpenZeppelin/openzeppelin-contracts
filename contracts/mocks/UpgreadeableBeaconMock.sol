// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IBeacon} from "../proxy/beacon/IBeacon.sol";

contract UpgradeableBeaconMock is IBeacon {
    address public implementation;

    constructor(address impl) {
        implementation = impl;
    }
}
