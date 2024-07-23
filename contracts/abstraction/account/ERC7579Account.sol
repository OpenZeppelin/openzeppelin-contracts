// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "./Account.sol";
import {Address} from "../../utils/Address.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {IERC165, ERC165} from "../../utils/introspection/ERC165.sol";
import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC7579Execution, IERC7579AccountConfig, IERC7579ModuleConfig} from "../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_SIGNER, MODULE_TYPE_VALIDATOR, MODULE_TYPE_EXECUTOR} from "../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, Execution, Mode, CallType, ExecType} from "../utils/ERC7579Utils.sol";

abstract contract ERC7579Account is
    IERC165, // required by erc-7579
    IERC1271, // required by erc-7579
    IERC7579Execution, // required by erc-7579
    IERC7579AccountConfig, // required by erc-7579
    IERC7579ModuleConfig, // required by erc-7579
    Account,
    ERC165,
    ERC721Holder,
    ERC1155Holder
{
    using ERC7579Utils for *;

    event ERC7579TryExecuteUnsuccessful(uint256 batchExecutionindex, bytes result);
    error ERC7579UnsupportedCallType(CallType callType);
    error ERC7579UnsupportedExecType(ExecType execType);
    error MismatchModuleTypeId(uint256 moduleTypeId, address module);
    error UnsupportedModuleType(uint256 moduleTypeId);
    error ModuleRestricted(uint256 moduleTypeId, address caller);
    error ModuleAlreadyInstalled(uint256 moduleTypeId, address module);
    error ModuleNotInstalled(uint256 moduleTypeId, address module);

    modifier onlyModule(uint256 moduleTypeId) {
        if (!isModuleInstalled(moduleTypeId, msg.sender, msg.data)) {
            revert ModuleRestricted(moduleTypeId, msg.sender);
        }
        _;
    }

    receive() external payable {}

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(IERC165, ERC165, ERC1155Holder) returns (bool) {
        // TODO: more?
        return super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC1271
    function isValidSignature(bytes32 hash, bytes calldata signature) public pure returns (bytes4 magicValue) {
        // TODO: view
        /// TODO
        hash;
        signature;
        return bytes4(0);
    }

    /****************************************************************************************************************
     *                                              ERC-7579 Execution                                              *
     ****************************************************************************************************************/

    /// @inheritdoc IERC7579Execution
    function execute(bytes32 mode, bytes calldata executionCalldata) public virtual onlyEntryPoint {
        _execute(Mode.wrap(mode), executionCalldata);
    }

    /// @inheritdoc IERC7579Execution
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) public virtual onlyModule(MODULE_TYPE_EXECUTOR) returns (bytes[] memory) {
        return _execute(Mode.wrap(mode), executionCalldata);
    }

    function _execute(
        Mode mode,
        bytes calldata executionCalldata
    ) internal virtual returns (bytes[] memory returnData) {
        // TODO: ModeSelector? ModePayload?
        (CallType callType, ExecType execType, , ) = mode.decodeMode();

        if (callType == ERC7579Utils.CALLTYPE_SINGLE) {
            (address target, uint256 value, bytes calldata callData) = executionCalldata.decodeSingle();
            returnData = new bytes[](1);
            returnData[0] = _execute(0, execType, target, value, callData);
        } else if (callType == ERC7579Utils.CALLTYPE_BATCH) {
            Execution[] calldata executionBatch = executionCalldata.decodeBatch();
            returnData = new bytes[](executionBatch.length);
            for (uint256 i = 0; i < executionBatch.length; ++i) {
                returnData[i] = _execute(
                    i,
                    execType,
                    executionBatch[i].target,
                    executionBatch[i].value,
                    executionBatch[i].callData
                );
            }
        } else if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) {
            (address target, bytes calldata callData) = executionCalldata.decodeDelegate();
            returnData = new bytes[](1);
            returnData[0] = _executeDelegate(0, execType, target, callData);
        } else {
            revert ERC7579UnsupportedCallType(callType);
        }
    }

    function _execute(
        uint256 index,
        ExecType execType,
        address target,
        uint256 value,
        bytes memory data
    ) private returns (bytes memory) {
        if (execType == ERC7579Utils.EXECTYPE_DEFAULT) {
            (bool success, bytes memory returndata) = target.call{value: value}(data);
            Address.verifyCallResult(success, returndata);
            return returndata;
        } else if (execType == ERC7579Utils.EXECTYPE_TRY) {
            (bool success, bytes memory returndata) = target.call{value: value}(data);
            if (!success) emit ERC7579TryExecuteUnsuccessful(index, returndata);
            return returndata;
        } else {
            revert ERC7579UnsupportedExecType(execType);
        }
    }

    function _executeDelegate(
        uint256 index,
        ExecType execType,
        address target,
        bytes memory data
    ) private returns (bytes memory) {
        if (execType == ERC7579Utils.EXECTYPE_DEFAULT) {
            (bool success, bytes memory returndata) = target.delegatecall(data);
            Address.verifyCallResult(success, returndata);
            return returndata;
        } else if (execType == ERC7579Utils.EXECTYPE_TRY) {
            (bool success, bytes memory returndata) = target.delegatecall(data);
            if (!success) emit ERC7579TryExecuteUnsuccessful(index, returndata);
            return returndata;
        } else {
            revert ERC7579UnsupportedExecType(execType);
        }
    }

    /****************************************************************************************************************
     *                                         ERC-7579 Account and Modules                                         *
     ****************************************************************************************************************/

    /// @inheritdoc IERC7579AccountConfig
    function accountId() public view virtual returns (string memory) {
        //vendorname.accountname.semver
        return "@openzeppelin/contracts.erc7579account.v0-beta";
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsExecutionMode(bytes32 encodedMode) public view virtual returns (bool) {
        (CallType callType, , , ) = Mode.wrap(encodedMode).decodeMode();
        return
            callType == ERC7579Utils.CALLTYPE_SINGLE ||
            callType == ERC7579Utils.CALLTYPE_BATCH ||
            callType == ERC7579Utils.CALLTYPE_DELEGATECALL;
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsModule(uint256 /*moduleTypeId*/) public view virtual returns (bool) {
        return false;
    }

    /// @inheritdoc IERC7579ModuleConfig
    function installModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata initData
    ) public virtual onlyEntryPointOrSelf {
        if (moduleTypeId != MODULE_TYPE_SIGNER && !IERC7579Module(module).isModuleType(moduleTypeId))
            revert MismatchModuleTypeId(moduleTypeId, module);
        _installModule(moduleTypeId, module, initData);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    ) public virtual onlyEntryPointOrSelf {
        _uninstallModule(moduleTypeId, module, deInitData);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function isModuleInstalled(
        uint256 /*moduleTypeId*/,
        address /*module*/,
        bytes calldata /*additionalContext*/
    ) public view virtual returns (bool) {
        return false;
    }

    /****************************************************************************************************************
     *                                                    Hooks                                                     *
     ****************************************************************************************************************/

    function _installModule(uint256 moduleTypeId, address /*module*/, bytes calldata /*initData*/) internal virtual {
        revert UnsupportedModuleType(moduleTypeId);
    }

    function _uninstallModule(
        uint256 moduleTypeId,
        address /*module*/,
        bytes calldata /*deInitData*/
    ) internal virtual {
        revert UnsupportedModuleType(moduleTypeId);
    }
}
