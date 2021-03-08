// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../proxy/ERC1967/ERC1967Upgrade.sol";
import "../../proxy/ERC1967/ERC1967UpgradeSecure.sol";
import "../../utils/Address.sol";
import "../../utils/StorageSlot.sol";

contract ERC1967UpgradeMock is ERC1967Upgrade {
    function beforeUpgrade(address) internal virtual override {
        // do nothing → enable upgrapdes without security
    }
}

contract ERC1967UpgradeSecureMock is ERC1967UpgradeSecure {
    function beforeUpgrade(address) internal virtual override {
        // do nothing → enable upgrapdes without security
    }
}

contract ERC1967UpgradeBrokenMock is ERC1967Upgrade {
    function upgradeToAndCall(address newImplementation, bytes memory data) public payable virtual override {
        // do nothing → do not upgrade
    }
}
