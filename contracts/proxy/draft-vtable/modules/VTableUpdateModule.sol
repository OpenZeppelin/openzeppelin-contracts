// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../VTable.sol";
import "../../../utils/Context.sol";

contract VTableUpdateModule is Context {
    using VTable for VTable.VTableStore;

    event VTableUpdate(bytes4 indexed selector, address oldImplementation, address newImplementation);

    struct ModuleDefinition {
        address implementation;
        bytes4[] selectors;
    }

    /**
     * @dev Updates the vtable
     */
    function updateVTable(ModuleDefinition[] calldata modules) public {
        VTable.VTableStore storage vtable = VTable.instance();
        require(VTable.instance().getOwner() == _msgSender(), "VTableOwnership: caller is not the owner");

        for (uint256 i = 0; i < modules.length; ++i) {
            ModuleDefinition memory module = modules[i];
            for (uint256 j = 0; j < module.selectors.length; ++j) {
                vtable.setFunction(module.selectors[j], module.implementation);
            }
        }
    }
}
