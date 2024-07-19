// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579AccountConfig, IERC7579ModuleConfig} from "../../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_FALLBACK} from "../../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, CallType} from "../../utils/ERC7579Utils.sol";
import {ERC7579Account} from "../ERC7579Account.sol";

abstract contract ERC7579AccountModuleFallback is ERC7579Account {
    struct FallbackHandler {
        address handler;
        CallType calltype;
    }

    mapping(bytes4 => FallbackHandler) private _fallbacks;

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
        /// TODO
        return super.isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    /// @inheritdoc ERC7579Account
    function _installModule(uint256 moduleTypeId, address module, bytes calldata initData) internal virtual override {
        if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector = bytes4(initData[0:4]);
            CallType calltype = CallType.wrap(bytes1(initData[4]));

            require(_fallbacks[selector].handler == address(0), "Function selector already used");
            require(
                calltype == ERC7579Utils.CALLTYPE_SINGLE || calltype == ERC7579Utils.CALLTYPE_STATIC,
                "Invalid fallback handler CallType"
            );
            _fallbacks[selector] = FallbackHandler(module, calltype);

            IERC7579Module(module).onInstall(initData[5:]);
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
            address handler = _fallbacks[selector].handler;

            require(handler != address(0), "Function selector not used");
            require(handler != module, "Function selector not used by this handler");
            delete _fallbacks[selector];

            IERC7579Module(module).onUninstall(deInitData[4:]);
        } else {
            super._uninstallModule(moduleTypeId, module, deInitData);
        }
    }

    fallback() external payable {
        uint256 value = msg.value;
        address handler = _fallbacks[msg.sig].handler;
        CallType calltype = _fallbacks[msg.sig].calltype;

        if (handler != address(0) && calltype == ERC7579Utils.CALLTYPE_SINGLE) {
            assembly ("memory-safe") {
                calldatacopy(0, 0, calldatasize())
                let result := call(gas(), handler, value, 0, calldatasize(), 0, 0)
                returndatacopy(0, 0, returndatasize())
                switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
            }
        } else if (handler != address(0) && calltype == ERC7579Utils.CALLTYPE_STATIC) {
            require(value == 0, "Static fallback handler should not receive value");
            assembly ("memory-safe") {
                calldatacopy(0, 0, calldatasize())
                let result := staticcall(gas(), handler, 0, calldatasize(), 0, 0)
                returndatacopy(0, 0, returndatasize())
                switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
            }
        } else {
            revert NoFallbackHandler(msg.sig);
        }
    }

    // TODO: getters?
}
