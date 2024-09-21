// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579ModuleConfig} from "../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_VALIDATOR, MODULE_TYPE_EXECUTOR, MODULE_TYPE_FALLBACK, MODULE_TYPE_HOOK} from "../../interfaces/IERC7579Module.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {ERC7579Utils} from "./utils/ERC7579Utils.sol";

abstract contract ERC7579ModuleConfig is IERC7579ModuleConfig {
    using EnumerableSet for *;

    error ERC7579MismatchedModuleTypeId(uint256 moduleTypeId, address module);
    error ERC7579UninstalledModule(uint256 moduleTypeId, address module);
    error ERC7579AlreadyInstalledModule(uint256 moduleTypeId, address module);
    error ERC7579UnsupportedModuleType(uint256 moduleTypeId);

    EnumerableSet.AddressSet private _validators;
    EnumerableSet.AddressSet private _executors;
    mapping(bytes4 => address) private _fallbacks;

    modifier onlyModule(uint256 moduleTypeId) {
        _checkModule(moduleTypeId);
        _;
    }

    function _supportsModule(uint256 moduleTypeId) internal view virtual returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_VALIDATOR ||
            moduleTypeId == MODULE_TYPE_EXECUTOR ||
            moduleTypeId == MODULE_TYPE_FALLBACK;
    }

    function _fallbackHandler(bytes4 selector) internal view virtual returns (address) {
        return _fallbacks[selector];
    }

    function _installModule(uint256 moduleTypeId, address module, bytes calldata initData) internal virtual {
        if (!_supportsModule(moduleTypeId)) revert ERC7579UnsupportedModuleType(moduleTypeId);
        if (!IERC7579Module(module).isModuleType(moduleTypeId))
            revert ERC7579MismatchedModuleTypeId(moduleTypeId, module);
        if (
            (moduleTypeId == MODULE_TYPE_VALIDATOR && !_validators.add(module)) ||
            (moduleTypeId == MODULE_TYPE_EXECUTOR && !_executors.add(module)) ||
            (moduleTypeId == MODULE_TYPE_FALLBACK && !_installFallback(module, bytes4(initData[0:4])))
        ) revert ERC7579AlreadyInstalledModule(moduleTypeId, module);

        if (moduleTypeId == MODULE_TYPE_FALLBACK) initData = initData[4:];

        IERC7579Module(module).onInstall(initData);
        emit ModuleInstalled(moduleTypeId, module);
    }

    function _uninstallModule(uint256 moduleTypeId, address module, bytes calldata deInitData) internal virtual {
        if (
            (moduleTypeId == MODULE_TYPE_VALIDATOR && !_validators.remove(module)) ||
            (moduleTypeId == MODULE_TYPE_EXECUTOR && !_executors.remove(module)) ||
            (moduleTypeId == MODULE_TYPE_FALLBACK && !_uninstallFallback(module, bytes4(deInitData[0:4])))
        ) revert ERC7579UninstalledModule(moduleTypeId, module);

        if (moduleTypeId == MODULE_TYPE_FALLBACK) deInitData = deInitData[4:];

        IERC7579Module(module).onUninstall(deInitData);
        emit ModuleUninstalled(moduleTypeId, module);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) public view virtual returns (bool) {
        return _isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    function _isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) internal view virtual returns (bool) {
        if (moduleTypeId == MODULE_TYPE_VALIDATOR) return _validators.contains(module);
        if (moduleTypeId == MODULE_TYPE_EXECUTOR) return _executors.contains(module);
        if (moduleTypeId == MODULE_TYPE_FALLBACK) return _fallbacks[bytes4(additionalContext[0:4])] != module;
        return false;
    }

    function _installFallback(address module, bytes4 selector) internal virtual returns (bool) {
        if (_fallbacks[selector] != address(0)) return false;
        _fallbacks[selector] = module;
        return true;
    }

    function _uninstallFallback(address module, bytes4 selector) internal virtual returns (bool) {
        address handler = _fallbacks[selector];
        if (handler == address(0) || handler != module) return false;
        delete _fallbacks[selector];
        return true;
    }

    function _checkModule(uint256 moduleTypeId) internal view {
        if (!_isModuleInstalled(moduleTypeId, msg.sender, msg.data)) {
            revert ERC7579UninstalledModule(moduleTypeId, msg.sender);
        }
    }
}
