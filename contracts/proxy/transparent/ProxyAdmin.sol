// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.3) (proxy/transparent/ProxyAdmin.sol)

pragma solidity ^0.8.19;

import {ITransparentUpgradeableProxy} from "./TransparentUpgradeableProxy.sol";
import {Ownable} from "../../access/Ownable.sol";
import {Address} from "../../utils/Address.sol";

/**
 * @dev This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
 * explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.
 */
contract ProxyAdmin is Ownable {
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
     */
    function upgradeAndCall(
        ITransparentUpgradeableProxy proxy,
        address implementation,
        bytes memory data
    ) public payable virtual {
        // Owner checked by _upgrade
        _upgrade(proxy, implementation);
        Address.functionCallWithValue(address(proxy), data, msg.value);
    }

    /**
     * @dev Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-_dispatchUpgradeTo}.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function upgrade(ITransparentUpgradeableProxy proxy, address implementation) public virtual {
        // Owner checked by _upgrade
        _upgrade(proxy, implementation);
    }

    /**
     * @dev Upgrades `proxy` to `implementation`.
     *
     * Requirements:
     *
     * - This contract must be the admin of `proxy`.
     */
    function _upgrade(ITransparentUpgradeableProxy proxy, address implementation) internal onlyOwner {
        proxy.upgradeTo(implementation);
    }
}
