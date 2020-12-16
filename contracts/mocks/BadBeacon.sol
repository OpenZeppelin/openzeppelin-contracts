// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

contract BadBeaconNoImpl {
}

contract BadBeaconNotContract {
    function implementation() external pure returns (address) {
        return address(0x1);
    }
}
