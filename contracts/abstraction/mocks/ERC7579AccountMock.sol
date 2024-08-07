// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {MODULE_TYPE_SIGNER, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {Account} from "../account/Account.sol";
import {ERC7579Account} from "../account/ERC7579Account.sol";
import {ERC7579AccountMultisig} from "../account/modules/ERC7579AccountMultisig.sol";
import {ERC7579AccountModuleExecutor} from "../account/modules/ERC7579AccountModuleExecutor.sol";
import {ERC7579AccountModuleFallback} from "../account/modules/ERC7579AccountModuleFallback.sol";
import {ERC7579AccountModuleHook} from "../account/modules/ERC7579AccountModuleHook.sol";
import {ERC7579AccountModuleSigner} from "../account/modules/ERC7579AccountModuleSigner.sol";
import {ERC7579AccountModuleValidator} from "../account/modules/ERC7579AccountModuleValidator.sol";

contract ERC7579AccountMock is
    ERC7579AccountMultisig,
    ERC7579AccountModuleExecutor,
    ERC7579AccountModuleFallback,
    ERC7579AccountModuleHook,
    ERC7579AccountModuleSigner,
    ERC7579AccountModuleValidator
{
    uint256 private _requiredSignatures;

    constructor(
        IEntryPoint entryPoint_,
        uint256 requiredSignatures_,
        address[] memory signers_,
        address[] memory validator_
    ) Account(entryPoint_) {
        _requiredSignatures = requiredSignatures_;

        for (uint256 i = 0; i < signers_.length; ++i) {
            _installModule(MODULE_TYPE_SIGNER, signers_[i], msg.data[0:0]);
        }
        for (uint256 i = 0; i < validator_.length; ++i) {
            _installModule(MODULE_TYPE_VALIDATOR, validator_[i], msg.data[0:0]);
        }
    }

    // function supportsInterface(
    //     bytes4 interfaceId
    // ) public view virtual override(ERC7579Account, AccessControl) returns (bool) {
    //     return super.supportsInterface(interfaceId);
    // }

    function requiredSignatures() public view virtual override returns (uint256) {
        return _requiredSignatures;
    }

    function supportsModule(
        uint256 moduleTypeId
    )
        public
        view
        virtual
        override(
            ERC7579Account,
            ERC7579AccountModuleExecutor,
            ERC7579AccountModuleFallback,
            ERC7579AccountModuleHook,
            ERC7579AccountModuleSigner,
            ERC7579AccountModuleValidator
        )
        returns (bool)
    {
        return super.supportsModule(moduleTypeId);
    }

    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    )
        public
        view
        virtual
        override(
            ERC7579Account,
            ERC7579AccountModuleExecutor,
            ERC7579AccountModuleFallback,
            ERC7579AccountModuleHook,
            ERC7579AccountModuleSigner,
            ERC7579AccountModuleValidator
        )
        returns (bool)
    {
        return super.isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    function _installModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata initData
    )
        internal
        virtual
        override(
            ERC7579Account,
            ERC7579AccountModuleExecutor,
            ERC7579AccountModuleFallback,
            ERC7579AccountModuleHook,
            ERC7579AccountModuleSigner,
            ERC7579AccountModuleValidator
        )
    {
        super._installModule(moduleTypeId, module, initData);
    }

    function _uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    )
        internal
        virtual
        override(
            ERC7579Account,
            ERC7579AccountModuleExecutor,
            ERC7579AccountModuleFallback,
            ERC7579AccountModuleHook,
            ERC7579AccountModuleSigner,
            ERC7579AccountModuleValidator
        )
    {
        super._uninstallModule(moduleTypeId, module, deInitData);
    }
}
