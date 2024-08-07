// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579AccountConfig, IERC7579ModuleConfig} from "../../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_FALLBACK} from "../../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, CallType} from "../../utils/ERC7579Utils.sol";
import {ERC7579Account} from "../ERC7579Account.sol";

abstract contract ERC7579AccountModuleFallback is ERC7579Account {
    mapping(bytes4 => address) private _fallbacks;

    error FallbackHandlerAlreadySet(bytes4 selector);
    error FallbackHandlerNotSet(bytes4 selector);
    error NoFallbackHandler(bytes4 selector);

    /// @inheritdoc IERC7579AccountConfig
    function supportsModule(uint256 moduleTypeId) public view virtual override returns (bool) {
        return moduleTypeId == MODULE_TYPE_FALLBACK || super.supportsModule(moduleTypeId);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) public view virtual override returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_FALLBACK
                ? _fallbacks[bytes4(additionalContext[0:4])] == module
                : super.isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    /// @inheritdoc ERC7579Account
    function _installModule(uint256 moduleTypeId, address module, bytes calldata initData) internal virtual override {
        if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector = bytes4(initData[0:4]);

            if (_fallbacks[selector] != address(0)) revert FallbackHandlerAlreadySet(selector);
            _fallbacks[selector] = module;

            IERC7579Module(module).onInstall(initData[4:]);
            emit ModuleInstalled(moduleTypeId, module);
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
        if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector = bytes4(deInitData[0:4]);

            address handler = _fallbacks[selector];
            if (handler == address(0) || handler != module) revert FallbackHandlerNotSet(selector);
            delete _fallbacks[selector];

            IERC7579Module(module).onUninstall(deInitData[4:]);
            emit ModuleUninstalled(moduleTypeId, module);
        } else {
            super._uninstallModule(moduleTypeId, module, deInitData);
        }
    }

    fallback() external payable {
        address handler = _fallbacks[msg.sig];
        if (handler == address(0)) revert NoFallbackHandler(msg.sig);

        // From https://eips.ethereum.org/EIPS/eip-7579#fallback[ERC-7579 specifications]:
        // - MUST utilize ERC-2771 to add the original msg.sender to the calldata sent to the fallback handler
        // - MUST use call to invoke the fallback handler
        (bool success, bytes memory returndata) = handler.call{value: msg.value}(
            abi.encodePacked(msg.data, msg.sender)
        );
        assembly ("memory-safe") {
            switch success
            case 0 {
                revert(add(returndata, 0x20), mload(returndata))
            }
            default {
                return(add(returndata, 0x20), mload(returndata))
            }
        }
    }

    // TODO: getters?
}
