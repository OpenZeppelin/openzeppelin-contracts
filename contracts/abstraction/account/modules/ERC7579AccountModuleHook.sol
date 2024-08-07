// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579AccountConfig, IERC7579ModuleConfig} from "../../../interfaces/IERC7579Account.sol";
import {IERC7579Module, IERC7579Hook, MODULE_TYPE_HOOK} from "../../../interfaces/IERC7579Module.sol";
import {ERC7579Account} from "../ERC7579Account.sol";

abstract contract ERC7579AccountModuleHook is ERC7579Account {
    address private _hook;

    modifier withHook() {
        address hook = _hook;
        if (hook == address(0)) {
            _;
        } else {
            bytes memory hookData = IERC7579Hook(hook).preCheck(msg.sender, msg.value, msg.data);
            _;
            IERC7579Hook(hook).postCheck(hookData);
        }
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsModule(uint256 moduleTypeId) public view virtual override returns (bool) {
        return moduleTypeId == MODULE_TYPE_HOOK || super.supportsModule(moduleTypeId);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) public view virtual override returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_HOOK
                ? module == _hook
                : super.isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    /// @inheritdoc ERC7579Account
    function _installModule(uint256 moduleTypeId, address module, bytes calldata initData) internal virtual override {
        if (moduleTypeId == MODULE_TYPE_HOOK) {
            if (_hook != address(0)) revert ModuleNotInstalled(moduleTypeId, _hook);
            _hook = module;
            IERC7579Module(module).onInstall(initData);
        } else {
            super._installModule(moduleTypeId, module, initData);
        }
    }

    /// @inheritdoc ERC7579Account
    function _uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    ) internal virtual override {
        if (moduleTypeId == MODULE_TYPE_HOOK) {
            if (_hook != module) revert ModuleAlreadyInstalled(moduleTypeId, module);
            delete _hook;
            IERC7579Module(module).onUninstall(deInitData);
        } else {
            super._uninstallModule(moduleTypeId, module, deInitData);
        }
    }

    // TODO: do something with the modifier?
    // TODO: getters?
}
