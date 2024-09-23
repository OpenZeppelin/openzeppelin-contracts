// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7579Execution} from "../../interfaces/IERC7579Account.sol";
import {IERC7579Module} from "../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, CallType, Execution, Mode} from "../utils/ERC7579Utils.sol";
import {EIP712} from "../../utils//cryptography/EIP712.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {EIP712NestedUtils} from "../../utils/cryptography/EIP712NestedUtils.sol";

abstract contract TypedExecutor is IERC7579Module, EIP712 {
    bytes internal constant _EXECUTE_REQUEST_SINGLE_TYPENAME =
        bytes("ExecuteSingle(address account,address target,uint256 value,bytes data)");
    bytes internal constant _EXECUTE_REQUEST_BATCH_TYPENAME =
        bytes("ExecuteBatch(address account,address[] targets,uint256[] values,bytes[] datas)");
    bytes internal constant _EXECUTE_REQUEST_DELEGATECALL_TYPENAME =
        bytes("ExecuteDelegate(address account,address target,bytes data)");

    bytes32 internal constant _EXECUTE_REQUEST_SINGLE_TYPEHASH = keccak256(_EXECUTE_REQUEST_SINGLE_TYPENAME);
    bytes32 internal constant _EXECUTE_REQUEST_BATCH_TYPEHASH = keccak256(_EXECUTE_REQUEST_BATCH_TYPENAME);
    bytes32 internal constant _EXECUTE_REQUEST_DELEGATECALL_TYPEHASH =
        keccak256(_EXECUTE_REQUEST_DELEGATECALL_TYPENAME);

    error UnauthorizedTypedExecution(CallType callType, address account, address sender);

    event ERC7579TypedExecutorInstalled(address indexed account);
    event ERC7579TypedExecutorUninstalled(address indexed account);

    /// @inheritdoc IERC7579Module
    function onInstall(bytes memory) public virtual {
        emit ERC7579TypedExecutorInstalled(msg.sender);
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes memory) public virtual {
        emit ERC7579TypedExecutorUninstalled(msg.sender);
    }

    function execute(address account, Mode mode, bytes calldata request, bytes calldata signature) public virtual {
        (CallType callType, , , ) = ERC7579Utils.decodeMode(mode);
        if (callType == ERC7579Utils.CALLTYPE_SINGLE) return _single(mode, account, request, signature);
        if (callType == ERC7579Utils.CALLTYPE_BATCH) return _batch(mode, account, request, signature);
        if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) return _delegate(mode, account, request, signature);
        revert ERC7579Utils.ERC7579UnsupportedCallType(callType);
    }

    function _single(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address target, uint256 value, bytes calldata data) = ERC7579Utils.decodeSingle(request);
        bytes32 requestHash = _hashTypedDataV4(_singleStructHash(account, target, value, data));
        if (!_isValidExecuteRequest(account, requestHash, signature, _EXECUTE_REQUEST_SINGLE_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_SINGLE, account, msg.sender);
        IERC7579Execution(account).executeFromExecutor(
            Mode.unwrap(mode),
            ERC7579Utils.encodeSingle(target, value, data)
        );
    }

    function _batch(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address[] memory targets, uint256[] memory values, bytes[] memory datas) = abi.decode(
            request,
            (address[], uint256[], bytes[])
        );
        bytes32 requestHash = _hashTypedDataV4(_batchStructHash(account, targets, values, datas));
        if (!_isValidExecuteRequest(account, requestHash, signature, _EXECUTE_REQUEST_BATCH_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_BATCH, account, msg.sender);
        Execution[] calldata executions = ERC7579Utils.decodeBatch(request);
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeBatch(executions));
    }

    function _delegate(Mode mode, address account, bytes calldata request, bytes calldata signature) internal virtual {
        (address target, bytes calldata data) = ERC7579Utils.decodeDelegate(request);
        bytes32 requestHash = _hashTypedDataV4(_delegateStructHash(account, target, data));
        if (!_isValidExecuteRequest(account, requestHash, signature, _EXECUTE_REQUEST_DELEGATECALL_TYPENAME))
            revert UnauthorizedTypedExecution(ERC7579Utils.CALLTYPE_DELEGATECALL, account, msg.sender);
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeDelegate(target, data));
    }

    function _isValidExecuteRequest(
        address account,
        bytes32 requestHash,
        bytes calldata signature,
        bytes memory contentsType
    ) internal view virtual returns (bool) {
        bytes memory _signature = EIP712NestedUtils.nestSignature(
            signature,
            _domainSeparatorV4(),
            requestHash,
            contentsType
        );
        return SignatureChecker.isValidSignatureNow(account, requestHash, _signature);
    }

    function _singleStructHash(
        address account,
        address target,
        uint256 value,
        bytes calldata data
    ) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(_EXECUTE_REQUEST_SINGLE_TYPEHASH, account, target, value, keccak256(data)));
    }

    function _batchStructHash(
        address account,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) internal view virtual returns (bytes32) {
        bytes32[] memory dataHashes = new bytes32[](datas.length);
        for (uint256 i = 0; i < datas.length; i++) {
            dataHashes[i] = keccak256(datas[i]);
        }
        bytes memory content = abi.encode(
            _EXECUTE_REQUEST_BATCH_TYPEHASH,
            account,
            targets,
            values,
            keccak256(abi.encodePacked(dataHashes))
        );
        return keccak256(content);
    }

    function _delegateStructHash(
        address account,
        address target,
        bytes memory data
    ) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(_EXECUTE_REQUEST_DELEGATECALL_TYPEHASH, account, target, keccak256(data)));
    }
}
