// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IProxiable.sol";
import "../ERC1967/ERC1967Upgrade.sol";

abstract contract Proxiable is IProxiable, ERC1967Upgrade {
    function upgradeTo(address newImplementation) external virtual override {
        _beforeUpgrade();
        ERC1967Upgrade._upgradeToAndCallSecure(newImplementation, bytes(""));
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        _beforeUpgrade();
        ERC1967Upgrade._upgradeToAndCallSecure(newImplementation, data);
    }

    function _beforeUpgrade() internal virtual;
}
