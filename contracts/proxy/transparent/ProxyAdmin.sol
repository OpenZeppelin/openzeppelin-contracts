// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0-rc.0) (proxy/transparent/ProxyAdmin.sol)

pragma solidity ^0.8.20;

import {ITransparentUpgradeableProxy} from "./TransparentUpgradeableProxy.sol";
import {Ownable} from "../../access/Ownable.sol";

/**
 * @dev This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
 * explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.
 */
contract ProxyAdmin is Ownable {
    /**
     * @dev The version of the upgrade interface of the contract. If this getter is missing, both `upgrade(address)`
     * and `upgradeAndCall(address,bytes)` are present, and `upgradeTo` must be used if no function should be called,
     * while `upgradeAndCall` will invoke the `receive` function if the second argument is the empty byte string.
     * If the getter returns `"5.0.0"`, only `upgradeAndCall(address,bytes)` is present, and the second argument must
     * be the empty byte string if no function should be called, making it impossible to invoke the `receive` function
     * during an upgrade.
     */
    string public constant UPGRADE_INTERFACE_VERSION = "5.0.0";

    /**
     * @dev Sets the initial owner who can perform upgrades.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation.
     * See {TransparentUpgradeableProxy-_dispatchUpgradeToAndCall}.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     * - If `data` is empty, `msg.value` must be zero.
     */
    function upgradeAndCall(
        ITransparentUpgradeableProxy proxy,
        address implementation,
        bytes memory data
    ) public payable virtual onlyOwner {
        proxy.upgradeToAndCall{value: msg.value}(implementation, data);
    }
}
