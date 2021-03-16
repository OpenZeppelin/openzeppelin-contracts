// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface to the, non-yet standardized, upgrade functions used by {TransparentUpgradeableProxy} and
 * openzeppelin-upgrades compatible {ERC1967Proxy} implementations.
 */
interface IProxiable {
    function upgradeTo(address) external;
    function upgradeToAndCall(address, bytes calldata) external payable;
}
