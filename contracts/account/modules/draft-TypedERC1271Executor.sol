// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579Execution, IERC7579Module, MODULE_TYPE_EXECUTOR} from "../../interfaces/draft-IERC7579.sol";
import {ERC7579Utils, CallType, Execution, Mode} from "../utils/draft-ERC7579Utils.sol";
import {EIP712} from "../../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC7739Utils} from "../../utils/cryptography/draft-ERC7739Utils.sol";

/**
 * @dev An ERC7579 module that allows to execute an account's operations using {IERC1271}
 * to validate typed execution requests.
 */
abstract contract TypedERC1271Executor is EIP712, IERC7579Module {
    bytes internal constant EXECUTE_REQUEST_SINGLE_TYPENAME =
        bytes("ExecuteSingle(address account,address target,uint256 value,bytes data)");
    bytes internal constant EXECUTE_REQUEST_BATCH_TYPENAME =
        bytes("ExecuteBatch(address account,address[] targets,uint256[] values,bytes[] calldatas)");
    bytes internal constant EXECUTE_REQUEST_DELEGATECALL_TYPENAME =
        bytes("ExecuteDelegate(address account,address target,bytes data)");

    bytes32 internal constant EXECUTE_REQUEST_SINGLE_TYPEHASH = keccak256(EXECUTE_REQUEST_SINGLE_TYPENAME);
    bytes32 internal constant EXECUTE_REQUEST_BATCH_TYPEHASH = keccak256(EXECUTE_REQUEST_BATCH_TYPENAME);
    bytes32 internal constant EXECUTE_REQUEST_DELEGATECALL_TYPEHASH = keccak256(EXECUTE_REQUEST_DELEGATECALL_TYPENAME);

    /**
     * @dev The execution request is unauthorized.
     */
    error UnauthorizedTypedExecution(CallType callType, address account, address sender);

    /**
     * @dev The `account` installed this module.
     */
    event ERC7579TypedExecutorInstalled(address indexed account);

    /**
     * @dev The `account` uninstalled this module.
     */
    event ERC7579TypedExecutorUninstalled(address indexed account);

    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_EXECUTOR;
    }

    /// @inheritdoc IERC7579Module
    function onInstall(bytes memory) public virtual {
        emit ERC7579TypedExecutorInstalled(msg.sender);
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes memory) public virtual {
        emit ERC7579TypedExecutorUninstalled(msg.sender);
    }

    /**
     * @dev Executes an account's operation following ERC7579's execution mode with support for single, batch, and delegate calls.
     */
    function execute(address account, Mode mode, bytes calldata request, bytes calldata signature) public virtual {
        (CallType callType, , , ) = ERC7579Utils.decodeMode(mode);
        if (callType == ERC7579Utils.CALLTYPE_SINGLE) return _single(mode, account, request, signature);
        if (callType == ERC7579Utils.CALLTYPE_BATCH) return _batch(mode, account, request, signature);
        if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) return _delegate(mode, account, request, signature);
        revert ERC7579Utils.ERC7579UnsupportedCallType(callType);
    }

    /**
     * @dev Calls {AccountERC7579-executeFromExecutor} with a single call operation.
     */
    function _single(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address target, uint256 value, bytes calldata data) = ERC7579Utils.decodeSingle(request);
        bytes32 requestHash = _hashTypedDataV4(_singleStructHash(account, target, value, data));
        if (!_isValidExecuteRequest(account, requestHash, signature, EXECUTE_REQUEST_SINGLE_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_SINGLE, account, msg.sender);
        IERC7579Execution(account).executeFromExecutor(
            Mode.unwrap(mode),
            ERC7579Utils.encodeSingle(target, value, data)
        );
    }

    /**
     * @dev Calls {AccountERC7579-executeFromExecutor} with batched calls.
     */
    function _batch(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = abi.decode(
            request,
            (address[], uint256[], bytes[])
        );
        bytes32 requestHash = _hashTypedDataV4(_batchStructHash(account, targets, values, calldatas));
        if (!_isValidExecuteRequest(account, requestHash, signature, EXECUTE_REQUEST_BATCH_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_BATCH, account, msg.sender);
        Execution[] calldata executions = ERC7579Utils.decodeBatch(request);
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeBatch(executions));
    }

    /**
     * @dev Calls {AccountERC7579-executeFromExecutor} with a delegate call operation.
     */
    function _delegate(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address target, bytes calldata data) = ERC7579Utils.decodeDelegate(request);
        bytes32 requestHash = _hashTypedDataV4(_delegateStructHash(account, target, data));
        if (!_isValidExecuteRequest(account, requestHash, signature, EXECUTE_REQUEST_DELEGATECALL_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_DELEGATECALL, account, msg.sender);
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeDelegate(target, data));
    }

    /**
     * @dev Checks whether the execution request was signed by the `account`.
     */
    function _isValidExecuteRequest(
        address account,
        bytes32 requestHash,
        bytes calldata signature,
        bytes memory contentsType
    ) internal view virtual returns (bool) {
        bytes memory _signature = ERC7739Utils.wrapTypedDataSig(
            signature,
            _domainSeparatorV4(),
            requestHash,
            contentsType
        );
        return SignatureChecker.isValidSignatureNow(account, requestHash, _signature);
    }

    /**
     * @dev Calculates the hash of a single execution request.
     */
    function _singleStructHash(
        address account,
        address target,
        uint256 value,
        bytes calldata data
    ) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(EXECUTE_REQUEST_SINGLE_TYPEHASH, account, target, value, keccak256(data)));
    }

    /**
     * @dev Calculates the hash of a batched execution request.
     */
    function _batchStructHash(
        address account,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) internal view virtual returns (bytes32) {
        uint256 length = calldatas.length;
        bytes32[] memory dataHashes = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            dataHashes[i] = keccak256(calldatas[i]);
        }
        bytes memory content = abi.encode(
            EXECUTE_REQUEST_BATCH_TYPEHASH,
            account,
            targets,
            values,
            keccak256(abi.encodePacked(dataHashes))
        );
        return keccak256(content);
    }

    /**
     * @dev Calculates the hash of a delegate call execution request.
     */
    function _delegateStructHash(
        address account,
        address target,
        bytes memory data
    ) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(EXECUTE_REQUEST_DELEGATECALL_TYPEHASH, account, target, keccak256(data)));
    }
}
