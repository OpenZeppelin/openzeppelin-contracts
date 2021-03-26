// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IProxiable.sol";
import "../ERC1967/ERC1967Upgrade.sol";

/**
 * @dev Base contract for building openzeppelin-upgrades compatible implementations for the {ERC1967Proxy}. It includes
 * publicly available upgrade functions that are called by the plugin and by the secure upgrade mechanism to verify
 * continuation of the upgradability.
 *
 * The {_beforeUpgrade} function MUST be overridden to include access restriction to the upgrade mechanism.
 */
abstract contract Proxiable is IProxiable, ERC1967Upgrade {
    function upgradeTo(address newImplementation) external virtual override {
        _beforeUpgrade(newImplementation);
        _upgradeToAndCallSecure(newImplementation, bytes(""), false);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        _beforeUpgrade(newImplementation);
        _upgradeToAndCallSecure(newImplementation, data, true);
    }

    function _authorizeUpgrade(address newImplementation) internal virtual;
}
