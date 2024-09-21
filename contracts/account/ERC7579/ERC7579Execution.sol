// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "../../utils/Address.sol";
import {IERC7579Execution} from "../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_EXECUTOR} from "../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, Mode, CallType, ExecType, Execution} from "./utils/ERC7579Utils.sol";

abstract contract ERC7579Execution is IERC7579Execution {
    using ERC7579Utils for *;

    error ERC7579UnsupportedCallType(CallType callType);
    error ERC7579UnsupportedExecType(ExecType execType);
    event ERC7579TryExecuteFail(uint256 batchExecutionIndex, bytes result);

    function _execute(bytes32 mode, bytes calldata executionCalldata) internal virtual {
        _call(Mode.wrap(mode), executionCalldata);
    }

    function _executeFromExecutor(
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal virtual returns (bytes[] memory) {
        return _call(Mode.wrap(mode), executionCalldata);
    }

    function _call(Mode mode, bytes calldata executionCalldata) internal virtual returns (bytes[] memory returnData) {
        // TODO: ModeSelector? ModePayload?
        (CallType callType, ExecType execType, , ) = mode.decodeMode();

        if (callType == ERC7579Utils.CALLTYPE_SINGLE) return _callSingle(execType, executionCalldata);
        if (callType == ERC7579Utils.CALLTYPE_BATCH) return _callBatch(execType, executionCalldata);
        if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) return _delegateCall(execType, executionCalldata);
        revert ERC7579UnsupportedCallType(callType);
    }

    function _callSingle(
        ExecType execType,
        bytes calldata executionCalldata
    ) private returns (bytes[] memory returnData) {
        (address target, uint256 value, bytes calldata callData) = executionCalldata.decodeSingle();
        returnData = new bytes[](1);
        returnData[0] = _call(0, execType, target, value, callData);
    }

    function _callBatch(
        ExecType execType,
        bytes calldata executionCalldata
    ) private returns (bytes[] memory returnData) {
        Execution[] calldata executionBatch = executionCalldata.decodeBatch();
        returnData = new bytes[](executionBatch.length);
        for (uint256 i = 0; i < executionBatch.length; ++i) {
            returnData[i] = _call(
                i,
                execType,
                executionBatch[i].target,
                executionBatch[i].value,
                executionBatch[i].callData
            );
        }
    }

    function _delegateCall(
        ExecType execType,
        bytes calldata executionCalldata
    ) private returns (bytes[] memory returnData) {
        (address target, bytes calldata callData) = executionCalldata.decodeDelegate();
        returnData = new bytes[](1);
        (bool success, bytes memory returndata) = target.delegatecall(callData);
        returnData[0] = returndata;
        _validateExecutionMode(0, execType, success, returndata);
    }

    function _call(
        uint256 index,
        ExecType execType,
        address target,
        uint256 value,
        bytes memory data
    ) private returns (bytes memory) {
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return _validateExecutionMode(index, execType, success, returndata);
    }

    function _validateExecutionMode(
        uint256 index,
        ExecType execType,
        bool success,
        bytes memory returndata
    ) private returns (bytes memory) {
        if (execType == ERC7579Utils.EXECTYPE_DEFAULT) return Address.verifyCallResult(success, returndata);
        if (execType == ERC7579Utils.EXECTYPE_TRY) {
            if (!success) emit ERC7579TryExecuteFail(index, returndata);
            return returndata;
        }
        revert ERC7579UnsupportedExecType(execType);
    }
}
