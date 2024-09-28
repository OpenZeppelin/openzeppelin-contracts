// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {AccountBase} from "./AccountBase.sol";
import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {Address} from "../utils/Address.sol";
import {IERC7579AccountConfig, IERC7579Execution, IERC7579ModuleConfig} from "../interfaces/IERC7579Account.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR, MODULE_TYPE_EXECUTOR, MODULE_TYPE_FALLBACK} from "../interfaces/IERC7579Module.sol";
import {ERC7579Utils, Mode, CallType, ExecType} from "./utils/ERC7579Utils.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";

abstract contract AccountERC7579 is
    IERC7579ModuleConfig,
    IERC7579Execution,
    IERC7579AccountConfig,
    IERC1271,
    AccountBase
{
    using ERC7579Utils for *;
    using EnumerableSet for *;

    EnumerableSet.AddressSet private _validators;
    EnumerableSet.AddressSet private _executors;
    mapping(bytes4 => address) private _fallbacks;

    modifier onlyModule(uint256 moduleTypeId) {
        _checkModule(moduleTypeId, msg.sender);
        _;
    }

    /// @inheritdoc IERC1271
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual override returns (bytes4) {
        address module = abi.decode(signature[0:20], (address));
        if (!_isModuleInstalled(MODULE_TYPE_VALIDATOR, module, msg.data)) return bytes4(0xffffffff);
        return IERC7579Validator(module).isValidSignatureWithSender(msg.sender, hash, signature);
    }

    /// @inheritdoc IERC7579AccountConfig
    function accountId() public view virtual returns (string memory) {
        //vendorname.accountname.semver
        return "@openzeppelin/contracts.erc7579account.v0-beta";
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsExecutionMode(bytes32 encodedMode) public view virtual returns (bool) {
        return _supportsExecutionMode(encodedMode);
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsModule(uint256 moduleTypeId) public view virtual returns (bool) {
        return _supportsModule(moduleTypeId);
    }

    /// @inheritdoc IERC7579Execution
    function execute(bytes32 mode, bytes calldata executionCalldata) public virtual onlyEntryPointOrSelf {
        _execute(Mode.wrap(mode), executionCalldata);
    }

    /// @inheritdoc IERC7579Execution
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) public virtual onlyModule(MODULE_TYPE_EXECUTOR) returns (bytes[] memory) {
        return _execute(Mode.wrap(mode), executionCalldata);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) public view virtual returns (bool) {
        return _isModuleInstalled(moduleTypeId, module, additionalContext);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function installModule(
        uint256 moduleTypeId,
        address module,
        bytes memory initData
    ) public virtual onlyEntryPointOrSelf {
        _installModule(moduleTypeId, module, initData);
    }

    /// @inheritdoc IERC7579ModuleConfig
    function uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes memory deInitData
    ) public virtual onlyEntryPointOrSelf {
        _uninstallModule(moduleTypeId, module, deInitData);
    }

    function executeUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /*userOpHash*/
    ) public virtual override onlyEntryPointOrSelf {
        Address.functionDelegateCall(address(this), userOp.callData[4:]);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        PackedUserOperation memory userOpCopy = userOp;
        address module = abi.decode(userOp.signature[0:20], (address));
        userOpCopy.signature = userOp.signature[20:];
        return
            isModuleInstalled(MODULE_TYPE_EXECUTOR, module, userOp.signature[0:0])
                ? IERC7579Validator(module).validateUserOp(userOpCopy, userOpHash)
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    function _supportsExecutionMode(bytes32 encodedMode) internal pure virtual returns (bool) {
        (CallType callType, , , ) = Mode.wrap(encodedMode).decodeMode();
        return
            callType == ERC7579Utils.CALLTYPE_SINGLE ||
            callType == ERC7579Utils.CALLTYPE_BATCH ||
            callType == ERC7579Utils.CALLTYPE_DELEGATECALL;
    }

    function _execute(
        Mode mode,
        bytes calldata executionCalldata
    ) internal virtual returns (bytes[] memory returnData) {
        // TODO: ModeSelector? ModePayload?
        (CallType callType, ExecType execType, , ) = mode.decodeMode();

        if (callType == ERC7579Utils.CALLTYPE_SINGLE) return ERC7579Utils.execSingle(execType, executionCalldata);
        if (callType == ERC7579Utils.CALLTYPE_BATCH) return ERC7579Utils.execBatch(execType, executionCalldata);
        if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL)
            return ERC7579Utils.execDelegateCall(execType, executionCalldata);
        revert ERC7579Utils.ERC7579UnsupportedCallType(callType);
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

    function _installModule(uint256 moduleTypeId, address module, bytes memory initData) internal virtual {
        if (!_supportsModule(moduleTypeId)) revert ERC7579Utils.ERC7579UnsupportedModuleType(moduleTypeId);
        if (!IERC7579Module(module).isModuleType(moduleTypeId))
            revert ERC7579Utils.ERC7579MismatchedModuleTypeId(moduleTypeId, module);
        if (
            (moduleTypeId == MODULE_TYPE_VALIDATOR && !_validators.add(module)) ||
            (moduleTypeId == MODULE_TYPE_EXECUTOR && !_executors.add(module))
        ) revert ERC7579Utils.ERC7579AlreadyInstalledModule(moduleTypeId, module);

        if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector;
            (selector, initData) = abi.decode(initData, (bytes4, bytes));
            if (!_installFallback(module, selector))
                revert ERC7579Utils.ERC7579AlreadyInstalledModule(moduleTypeId, module);
        }

        IERC7579Module(module).onInstall(initData);
        emit ModuleInstalled(moduleTypeId, module);
    }

    function _uninstallModule(uint256 moduleTypeId, address module, bytes memory deInitData) internal virtual {
        if (
            (moduleTypeId == MODULE_TYPE_VALIDATOR && !_validators.remove(module)) ||
            (moduleTypeId == MODULE_TYPE_EXECUTOR && !_executors.remove(module))
        ) revert ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module);

        if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector;
            (selector, deInitData) = abi.decode(deInitData, (bytes4, bytes));
            if (!_uninstallFallback(module, selector))
                revert ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module);
        }

        IERC7579Module(module).onUninstall(deInitData);
        emit ModuleUninstalled(moduleTypeId, module);
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

    function _checkModule(uint256 moduleTypeId, address module) internal view virtual {
        if (!_isModuleInstalled(moduleTypeId, module, msg.data)) {
            revert ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module);
        }
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

    function _fallback() internal virtual {
        address handler = _fallbackHandler(msg.sig);
        if (handler == address(0)) return;

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

    fallback() external payable virtual {
        _fallback();
    }
}
