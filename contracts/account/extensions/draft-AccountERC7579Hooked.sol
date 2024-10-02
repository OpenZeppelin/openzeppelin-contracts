// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7579Hook, MODULE_TYPE_HOOK} from "../../interfaces/IERC7579Module.sol";
import {IERC7579ModuleConfig} from "../../interfaces/IERC7579Account.sol";
import {ERC7579Utils, Mode} from "../utils/ERC7579Utils.sol";
import {AccountERC7579} from "../draft-AccountERC7579.sol";

abstract contract AccountERC7579Hooked is AccountERC7579 {
    address private _hook;

    modifier withHook() {
        address hook_ = hook();
        if (hook_ == address(0)) {
            _;
        } else {
            bytes memory hookData = IERC7579Hook(hook_).preCheck(msg.sender, msg.value, msg.data);
            _;
            IERC7579Hook(hook_).postCheck(hookData);
        }
    }

    function hook() public view returns (address) {
        return _hook;
    }

    function _isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata data
    ) internal view override returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_HOOK
                ? _isHookInstalled(module)
                : super._isModuleInstalled(moduleTypeId, module, data);
    }

    function _execute(Mode mode, bytes calldata executionCalldata) internal override withHook returns (bytes[] memory) {
        return super._execute(mode, executionCalldata);
    }

    function _installModule(uint256 moduleTypeId, address module, bytes memory initData) internal virtual override {
        _hook = module;
        super._installModule(moduleTypeId, module, initData);
    }

    function _uninstallModule(uint256 moduleTypeId, address module, bytes memory deInitData) internal virtual override {
        _hook = address(0);
        super._uninstallModule(moduleTypeId, module, deInitData);
    }

    function _supportsModule(uint256 moduleTypeId) internal view virtual override returns (bool) {
        return moduleTypeId == MODULE_TYPE_HOOK || super._supportsModule(moduleTypeId);
    }

    function _isHookInstalled(address module) internal view returns (bool) {
        return _hook == module;
    }

    function _fallback() internal virtual override withHook {
        super._fallback();
    }
}
