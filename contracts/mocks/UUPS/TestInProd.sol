// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../proxy/ERC1967/ERC1967Upgrade.sol";
import "../../utils/Address.sol";
import "../../utils/StorageSlot.sol";

contract ERC1967UpgradeTestInProd is ERC1967Upgrade {
    string public constant name = type(ERC1967UpgradeTestInProd).name;

    function upgradeToAndCall(address newImplementation, bytes calldata data) public payable virtual override {
        address oldImplementation = _getImplementation();

        // do update
        _upgradeToAndCall(newImplementation, data);

        StorageSlot.BooleanSlot storage doingUpgrade = StorageSlot.getBooleanSlot(keccak256("eip1967.proxy.doingUpgrade"));

        if (!doingUpgrade.value) {
            // test in prod: do further upgrade
            doingUpgrade.value = true;
            Address.functionDelegateCall(
                newImplementation,
                abi.encodeWithSignature(
                    "upgradeToAndCall(address,bytes)", // ERC1967Upgrade(address(0)).upgrateToAndCall.selector,
                    oldImplementation,
                    bytes("")
                )
            );
            require(oldImplementation == _getImplementation(), "ERC1967Upgrade: upgrade breaks further upgrades");
            doingUpgrade.value = false;

            // redo upgrade
            _upgradeTo(newImplementation);
        }
    }
}

contract ERC1967UpgradeTestInProdBroken is ERC1967Upgrade {
    string public constant name = type(ERC1967UpgradeTestInProdBroken).name;

    function upgradeToAndCall(address newImplementation, bytes calldata data) public payable virtual override {
        // Do not upgrade
    }
}
