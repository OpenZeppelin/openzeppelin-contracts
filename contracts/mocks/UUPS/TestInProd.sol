// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../proxy/ERC1967/ERC1967Upgrade.sol";

contract ERC1967UpgradeMock is IERC1967Upgradeable, ERC1967Upgrade {
    function upgradeTo(address newImplementation) external virtual override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, bytes(""));
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, data);
    }
}

contract ERC1967UpgradeSecureMock is IERC1967Upgradeable, ERC1967Upgrade {
    function upgradeTo(address newImplementation) external virtual override {
        ERC1967Upgrade._upgradeToAndCallSecure(newImplementation, bytes(""));
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        ERC1967Upgrade._upgradeToAndCallSecure(newImplementation, data);
    }
}

contract ERC1967UpgradeBrokenMock is IERC1967Upgradeable, ERC1967Upgrade {
    function upgradeTo(address) external virtual override {
        // pass
    }
    function upgradeToAndCall(address, bytes memory) external payable virtual override {
        // pass
    }
}
