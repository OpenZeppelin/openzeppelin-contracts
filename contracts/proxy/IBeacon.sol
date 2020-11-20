// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev This is the interface that {BeaconUpgradeableProxy} expects of its beacon.
 */
interface IBeacon {
    /**
     * @dev Must return an address that can be used as a delegate call target.
     *
     * {BeaconUpgradeableProxy} will check that this address is a contract.
     */
    function implementation() external view returns (address);
}
