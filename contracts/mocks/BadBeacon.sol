// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import '../proxy/IBeacon.sol';

contract BadBeaconNoImpl {
}

contract BadBeaconNotContract is IBeacon {
    function implementation() external view override returns (address) {
        return address(0x1);
    }
}
