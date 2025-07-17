// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (account/extensions/draft-AccountERC7579.sol)

pragma solidity ^0.8.26;

import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC7579Module, IERC7579Validator, IERC7579Execution, IERC7579AccountConfig, IERC7579ModuleConfig, MODULE_TYPE_VALIDATOR, MODULE_TYPE_EXECUTOR, MODULE_TYPE_FALLBACK} from "../../interfaces/draft-IERC7579.sol";
import {ERC7579Utils, Mode, CallType, ExecType} from "../../account/utils/draft-ERC7579Utils.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {Bytes} from "../../utils/Bytes.sol";
import {Packing} from "../../utils/Packing.sol";
import {Address} from "../../utils/Address.sol";
import {Calldata} from "../../utils/Calldata.sol";
import {Account} from "../Account.sol";

/**
 * @dev Extension of {Account} that implements support for ERC-7579 modules.
 *
 * To comply with the ERC-1271 support requirement, this contract defers signature validation to
 * installed validator modules by calling {IERC7579Validator-isValidSignatureWithSender}.
 *
 * This contract does not implement validation logic for user operations since this functionality
 * is often delegated to self-contained validation modules. Developers must install a validator module
 * upon initialization (or any other mechanism to enable execution from the account):
 *
 * ```solidity
 * contract MyAccountERC7579 is AccountERC7579, Initializable {
 *   function initializeAccount(address validator, bytes calldata validatorData) public initializer {
 *     _installModule(MODULE_TYPE_VALIDATOR, validator, validatorData);
 *   }
 * }
 * ```
 *
 * [NOTE]
 * ====
 * * Hook support is not included. See {AccountERC7579Hooked} for a version that hooks to execution.
 * * Validator selection, when verifying either ERC-1271 signature or ERC-4337 UserOperation is implemented in
 *   internal virtual functions {_extractUserOpValidator} and {_extractSignatureValidator}. Both are implemented
 *   following common practices. However, this part is not standardized in ERC-7579 (or in any follow-up ERC). Some
 *   accounts may want to override these internal functions.
 * * When combined with {ERC7739}, resolution ordering of {isValidSignature} may have an impact ({ERC7739} does not
 *   call super). Manual resolution might be necessary.
 * * Static calls (using callType `0xfe`) are currently NOT supported.
 * ====
 *
 * WARNING: Removing all validator modules will render the account inoperable, as no user operations can be validated thereafter.
 */
abstract contract AccountERC7579 is Account, IERC1271, IERC7579Execution, IERC7579AccountConfig, IERC7579ModuleConfig {
    using Bytes for *;
    using ERC7579Utils for *;
    using EnumerableSet for *;
    using Packing for bytes32;

    EnumerableSet.AddressSet private _validators;
    EnumerableSet.AddressSet private _executors;
    mapping(bytes4 selector => address) private _fallbacks;

    /// @dev The account's {fallback} was called with a selector that doesn't have an installed handler.
    error ERC7579MissingFallbackHandler(bytes4 selector);

    /// @dev Modifier that checks if the caller is an installed module of the given type.
    modifier onlyModule(uint256 moduleTypeId, bytes calldata additionalContext) {
        _checkModule(moduleTypeId, msg.sender, additionalContext);
        _;
    }

    /// @dev See {_fallback}.
    fallback(bytes calldata) external payable virtual returns (bytes memory) {
        return _fallback();
    }

    /// @inheritdoc IERC7579AccountConfig
    function accountId() public view virtual returns (string memory) {
        // vendorname.accountname.semver
        return "@openzeppelin/community-contracts.AccountERC7579.v0.0.0";
    }

    /**
     * @inheritdoc IERC7579AccountConfig
     *
     * @dev Supported call types:
     * * Single (`0x00`): A single transaction execution.
     * * Batch (`0x01`): A batch of transactions execution.
     * * Delegate (`0xff`): A delegate call execution.
     *
     * Supported exec types:
     * * Default (`0x00`): Default execution type (revert on failure).
     * * Try (`0x01`): Try execution type (emits ERC7579TryExecuteFail on failure).
     */
    function supportsExecutionMode(bytes32 encodedMode) public view virtual returns (bool) {
        (CallType callType, ExecType execType, , ) = Mode.wrap(encodedMode).decodeMode();
        return
            (callType == ERC7579Utils.CALLTYPE_SINGLE ||
                callType == ERC7579Utils.CALLTYPE_BATCH ||
                callType == ERC7579Utils.CALLTYPE_DELEGATECALL) &&
            (execType == ERC7579Utils.EXECTYPE_DEFAULT || execType == ERC7579Utils.EXECTYPE_TRY);
    }

    /**
     * @inheritdoc IERC7579AccountConfig
     *
     * @dev Supported module types:
     *
     * * Validator: A module used during the validation phase to determine if a transaction is valid and
     * should be executed on the account.
     * * Executor: A module that can execute transactions on behalf of the smart account via a callback.
     * * Fallback Handler: A module that can extend the fallback functionality of a smart account.
     */
    function supportsModule(uint256 moduleTypeId) public view virtual returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_VALIDATOR ||
            moduleTypeId == MODULE_TYPE_EXECUTOR ||
            moduleTypeId == MODULE_TYPE_FALLBACK;
    }

    /// @inheritdoc IERC7579ModuleConfig
    function installModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata initData
    ) public virtual onlyEntryPointOrSelf {
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
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) public view virtual returns (bool) {
        if (moduleTypeId == MODULE_TYPE_VALIDATOR) return _validators.contains(module);
        if (moduleTypeId == MODULE_TYPE_EXECUTOR) return _executors.contains(module);
        if (moduleTypeId == MODULE_TYPE_FALLBACK) return _fallbacks[bytes4(additionalContext[0:4])] == module;
        return false;
    }

    /// @inheritdoc IERC7579Execution
    function execute(bytes32 mode, bytes calldata executionCalldata) public payable virtual onlyEntryPointOrSelf {
        _execute(Mode.wrap(mode), executionCalldata);
    }

    /// @inheritdoc IERC7579Execution
    function executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    )
        public
        payable
        virtual
        onlyModule(MODULE_TYPE_EXECUTOR, Calldata.emptyBytes())
        returns (bytes[] memory returnData)
    {
        return _execute(Mode.wrap(mode), executionCalldata);
    }

    /**
     * @dev Implement ERC-1271 through IERC7579Validator modules. If module based validation fails, fallback to
     * "native" validation by the abstract signer.
     *
     * NOTE: when combined with {ERC7739}, resolution ordering may have an impact ({ERC7739} does not call super).
     * Manual resolution might be necessary.
     */
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4) {
        // check signature length is enough for extraction
        if (signature.length >= 20) {
            (address module, bytes calldata innerSignature) = _extractSignatureValidator(signature);
            // if module is not installed, skip
            if (isModuleInstalled(MODULE_TYPE_VALIDATOR, module, Calldata.emptyBytes())) {
                // try validation, skip any revert
                try IERC7579Validator(module).isValidSignatureWithSender(msg.sender, hash, innerSignature) returns (
                    bytes4 magic
                ) {
                    return magic;
                } catch {}
            }
        }
        return bytes4(0xffffffff);
    }

    /**
     * @dev Validates a user operation with {_signableUserOpHash} and returns the validation data
     * if the module specified by the first 20 bytes of the nonce key is installed. Falls back to
     * {Account-_validateUserOp} otherwise.
     *
     * See {_extractUserOpValidator} for the module extraction logic.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256) {
        address module = _extractUserOpValidator(userOp);
        return
            isModuleInstalled(MODULE_TYPE_VALIDATOR, module, Calldata.emptyBytes())
                ? IERC7579Validator(module).validateUserOp(userOp, _signableUserOpHash(userOp, userOpHash))
                : super._validateUserOp(userOp, userOpHash);
    }

    /**
     * @dev ERC-7579 execution logic. See {supportsExecutionMode} for supported modes.
     *
     * Reverts if the call type is not supported.
     */
    function _execute(
        Mode mode,
        bytes calldata executionCalldata
    ) internal virtual returns (bytes[] memory returnData) {
        (CallType callType, ExecType execType, , ) = mode.decodeMode();
        if (callType == ERC7579Utils.CALLTYPE_SINGLE) return executionCalldata.execSingle(execType);
        if (callType == ERC7579Utils.CALLTYPE_BATCH) return executionCalldata.execBatch(execType);
        if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) return executionCalldata.execDelegateCall(execType);
        revert ERC7579Utils.ERC7579UnsupportedCallType(callType);
    }

    /**
     * @dev Installs a module of the given type with the given initialization data.
     *
     * For the fallback module type, the `initData` is expected to be the (packed) concatenation of a 4-byte
     * selector and the rest of the data to be sent to the handler when calling {IERC7579Module-onInstall}.
     *
     * Requirements:
     *
     * * Module type must be supported. See {supportsModule}. Reverts with {ERC7579Utils-ERC7579UnsupportedModuleType}.
     * * Module must be of the given type. Reverts with {ERC7579Utils-ERC7579MismatchedModuleTypeId}.
     * * Module must not be already installed. Reverts with {ERC7579Utils-ERC7579AlreadyInstalledModule}.
     *
     * Emits a {IERC7579ModuleConfig-ModuleInstalled} event.
     */
    function _installModule(uint256 moduleTypeId, address module, bytes memory initData) internal virtual {
        require(supportsModule(moduleTypeId), ERC7579Utils.ERC7579UnsupportedModuleType(moduleTypeId));
        require(
            IERC7579Module(module).isModuleType(moduleTypeId),
            ERC7579Utils.ERC7579MismatchedModuleTypeId(moduleTypeId, module)
        );

        if (moduleTypeId == MODULE_TYPE_VALIDATOR) {
            require(_validators.add(module), ERC7579Utils.ERC7579AlreadyInstalledModule(moduleTypeId, module));
        } else if (moduleTypeId == MODULE_TYPE_EXECUTOR) {
            require(_executors.add(module), ERC7579Utils.ERC7579AlreadyInstalledModule(moduleTypeId, module));
        } else if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector;
            (selector, initData) = _decodeFallbackData(initData);
            require(
                _fallbacks[selector] == address(0),
                ERC7579Utils.ERC7579AlreadyInstalledModule(moduleTypeId, module)
            );
            _fallbacks[selector] = module;
        }

        IERC7579Module(module).onInstall(initData);
        emit ModuleInstalled(moduleTypeId, module);
    }

    /**
     * @dev Uninstalls a module of the given type with the given de-initialization data.
     *
     * For the fallback module type, the `deInitData` is expected to be the (packed) concatenation of a 4-byte
     * selector and the rest of the data to be sent to the handler when calling {IERC7579Module-onUninstall}.
     *
     * Requirements:
     *
     * * Module must be already installed. Reverts with {ERC7579Utils-ERC7579UninstalledModule} otherwise.
     */
    function _uninstallModule(uint256 moduleTypeId, address module, bytes memory deInitData) internal virtual {
        require(supportsModule(moduleTypeId), ERC7579Utils.ERC7579UnsupportedModuleType(moduleTypeId));

        if (moduleTypeId == MODULE_TYPE_VALIDATOR) {
            require(_validators.remove(module), ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module));
        } else if (moduleTypeId == MODULE_TYPE_EXECUTOR) {
            require(_executors.remove(module), ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module));
        } else if (moduleTypeId == MODULE_TYPE_FALLBACK) {
            bytes4 selector;
            (selector, deInitData) = _decodeFallbackData(deInitData);
            require(
                _fallbackHandler(selector) == module && module != address(0),
                ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module)
            );
            delete _fallbacks[selector];
        }

        IERC7579Module(module).onUninstall(deInitData);
        emit ModuleUninstalled(moduleTypeId, module);
    }

    /**
     * @dev Fallback function that delegates the call to the installed handler for the given selector.
     *
     * Reverts with {ERC7579MissingFallbackHandler} if the handler is not installed.
     *
     * Calls the handler with the original `msg.sender` appended at the end of the calldata following
     * the ERC-2771 format.
     */
    function _fallback() internal virtual returns (bytes memory) {
        address handler = _fallbackHandler(msg.sig);
        require(handler != address(0), ERC7579MissingFallbackHandler(msg.sig));

        // From https://eips.ethereum.org/EIPS/eip-7579#fallback[ERC-7579 specifications]:
        // - MUST utilize ERC-2771 to add the original msg.sender to the calldata sent to the fallback handler
        // - MUST use call to invoke the fallback handler
        (bool success, bytes memory returndata) = handler.call{value: msg.value}(
            abi.encodePacked(msg.data, msg.sender)
        );

        if (success) return returndata;

        assembly ("memory-safe") {
            revert(add(returndata, 0x20), mload(returndata))
        }
    }

    /// @dev Returns the fallback handler for the given selector. Returns `address(0)` if not installed.
    function _fallbackHandler(bytes4 selector) internal view virtual returns (address) {
        return _fallbacks[selector];
    }

    /// @dev Checks if the module is installed. Reverts if the module is not installed.
    function _checkModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) internal view virtual {
        require(
            isModuleInstalled(moduleTypeId, module, additionalContext),
            ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module)
        );
    }

    /**
     * @dev Extracts the nonce validator from the user operation.
     *
     * To construct a nonce key, set nonce as follows:
     *
     * ```
     * <module address (20 bytes)> | <key (4 bytes)> | <nonce (8 bytes)>
     * ```
     * NOTE: The default behavior of this function replicates the behavior of
     * https://github.com/rhinestonewtf/safe7579/blob/bb29e8b1a66658790c4169e72608e27d220f79be/src/Safe7579.sol#L266[Safe adapter],
     * https://github.com/etherspot/etherspot-prime-contracts/blob/cfcdb48c4172cea0d66038324c0bae3288aa8caa/src/modular-etherspot-wallet/wallet/ModularEtherspotWallet.sol#L227[Etherspot's Prime Account], and
     * https://github.com/erc7579/erc7579-implementation/blob/16138d1afd4e9711f6c1425133538837bd7787b5/src/MSAAdvanced.sol#L247[ERC7579 reference implementation].
     *
     * This is not standardized in ERC-7579 (or in any follow-up ERC). Some accounts may want to override these internal functions.
     *
     * For example, https://github.com/bcnmy/nexus/blob/54f4e19baaff96081a8843672977caf712ef19f4/contracts/lib/NonceLib.sol#L17[Biconomy's Nexus]
     * uses a similar yet incompatible approach (the validator address is also part of the nonce, but not at the same location)
     */
    function _extractUserOpValidator(PackedUserOperation calldata userOp) internal pure virtual returns (address) {
        return address(bytes32(userOp.nonce).extract_32_20(0));
    }

    /**
     * @dev Extracts the signature validator from the signature.
     *
     * To construct a signature, set the first 20 bytes as the module address and the remaining bytes as the
     * signature data:
     *
     * ```
     * <module address (20 bytes)> | <signature data>
     * ```
     *
     * NOTE: The default behavior of this function replicates the behavior of
     * https://github.com/rhinestonewtf/safe7579/blob/bb29e8b1a66658790c4169e72608e27d220f79be/src/Safe7579.sol#L350[Safe adapter],
     * https://github.com/bcnmy/nexus/blob/54f4e19baaff96081a8843672977caf712ef19f4/contracts/Nexus.sol#L239[Biconomy's Nexus],
     * https://github.com/etherspot/etherspot-prime-contracts/blob/cfcdb48c4172cea0d66038324c0bae3288aa8caa/src/modular-etherspot-wallet/wallet/ModularEtherspotWallet.sol#L252[Etherspot's Prime Account], and
     * https://github.com/erc7579/erc7579-implementation/blob/16138d1afd4e9711f6c1425133538837bd7787b5/src/MSAAdvanced.sol#L296[ERC7579 reference implementation].
     *
     * This is not standardized in ERC-7579 (or in any follow-up ERC). Some accounts may want to override these internal functions.
     */
    function _extractSignatureValidator(
        bytes calldata signature
    ) internal pure virtual returns (address module, bytes calldata innerSignature) {
        return (address(bytes20(signature[0:20])), signature[20:]);
    }

    /**
     * @dev Extract the function selector from initData/deInitData for MODULE_TYPE_FALLBACK
     *
     * NOTE: If we had calldata here, we could use calldata slice which are cheaper to manipulate and don't require
     * actual copy. However, this would require `_installModule` to get a calldata bytes object instead of a memory
     * bytes object. This would prevent calling `_installModule` from a contract constructor and would force the use
     * of external initializers. That may change in the future, as most accounts will probably be deployed as
     * clones/proxy/ERC-7702 delegates and therefore rely on initializers anyway.
     */
    function _decodeFallbackData(
        bytes memory data
    ) internal pure virtual returns (bytes4 selector, bytes memory remaining) {
        return (bytes4(data), data.slice(4));
    }

    /// @dev By default, only use the modules for validation of userOp and signature. Disable raw signatures.
    function _rawSignatureValidation(
        bytes32 /*hash*/,
        bytes calldata /*signature*/
    ) internal view virtual override returns (bool) {
        return false;
    }
}
