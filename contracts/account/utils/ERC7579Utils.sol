// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Execution} from "../../interfaces/IERC7579Account.sol";
import {Packing} from "../../utils/Packing.sol";
import {Address} from "../../utils/Address.sol";

type Mode is bytes32;
type CallType is bytes1;
type ExecType is bytes1;
type ModeSelector is bytes4;
type ModePayload is bytes22;

library ERC7579Utils {
    using Packing for *;

    CallType constant CALLTYPE_SINGLE = CallType.wrap(0x00);
    CallType constant CALLTYPE_BATCH = CallType.wrap(0x01);
    CallType constant CALLTYPE_DELEGATECALL = CallType.wrap(0xFF);

    ExecType constant EXECTYPE_DEFAULT = ExecType.wrap(0x00);
    ExecType constant EXECTYPE_TRY = ExecType.wrap(0x01);

    event ERC7579TryExecuteFail(uint256 batchExecutionIndex, bytes result);

    error ERC7579UnsupportedCallType(CallType callType);
    error ERC7579UnsupportedExecType(ExecType execType);

    function execSingle(
        ExecType execType,
        bytes calldata executionCalldata
    ) internal returns (bytes[] memory returnData) {
        (address target, uint256 value, bytes calldata callData) = decodeSingle(executionCalldata);
        returnData = new bytes[](1);
        returnData[0] = _call(0, execType, target, value, callData);
    }

    function execBatch(
        ExecType execType,
        bytes calldata executionCalldata
    ) internal returns (bytes[] memory returnData) {
        Execution[] calldata executionBatch = decodeBatch(executionCalldata);
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

    function execDelegateCall(
        ExecType execType,
        bytes calldata executionCalldata
    ) internal returns (bytes[] memory returnData) {
        (address target, bytes calldata callData) = decodeDelegate(executionCalldata);
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
        bytes calldata data
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

    function encodeMode(
        CallType callType,
        ExecType execType,
        ModeSelector selector,
        ModePayload payload
    ) internal pure returns (Mode mode) {
        return
            Mode.wrap(
                CallType
                    .unwrap(callType)
                    .pack_1_1(ExecType.unwrap(execType))
                    .pack_2_4(bytes4(0))
                    .pack_6_4(ModeSelector.unwrap(selector))
                    .pack_10_22(ModePayload.unwrap(payload))
            );
    }

    function decodeMode(
        Mode mode
    ) internal pure returns (CallType callType, ExecType execType, ModeSelector selector, ModePayload payload) {
        return (
            CallType.wrap(Packing.extract_32_1(Mode.unwrap(mode), 0)),
            ExecType.wrap(Packing.extract_32_1(Mode.unwrap(mode), 1)),
            ModeSelector.wrap(Packing.extract_32_4(Mode.unwrap(mode), 6)),
            ModePayload.wrap(Packing.extract_32_22(Mode.unwrap(mode), 10))
        );
    }

    function encodeSingle(
        address target,
        uint256 value,
        bytes calldata callData
    ) internal pure returns (bytes memory executionCalldata) {
        return abi.encodePacked(target, value, callData);
    }

    function decodeSingle(
        bytes calldata executionCalldata
    ) internal pure returns (address target, uint256 value, bytes calldata callData) {
        target = address(bytes20(executionCalldata[0:20]));
        value = uint256(bytes32(executionCalldata[20:52]));
        callData = executionCalldata[52:];
    }

    function encodeDelegate(
        address target,
        bytes calldata callData
    ) internal pure returns (bytes memory executionCalldata) {
        return abi.encodePacked(target, callData);
    }

    function decodeDelegate(
        bytes calldata executionCalldata
    ) internal pure returns (address target, bytes calldata callData) {
        target = address(bytes20(executionCalldata[0:20]));
        callData = executionCalldata[20:];
    }

    function encodeBatch(Execution[] memory executionBatch) internal pure returns (bytes memory executionCalldata) {
        return abi.encode(executionBatch);
    }

    function decodeBatch(bytes calldata executionCalldata) internal pure returns (Execution[] calldata executionBatch) {
        assembly ("memory-safe") {
            let ptr := add(executionCalldata.offset, calldataload(executionCalldata.offset))
            // Extract the ERC7579 Executions
            executionBatch.offset := add(ptr, 32)
            executionBatch.length := calldataload(ptr)
        }
    }
}

// Operators
using {_eqCallTypeGlobal as ==} for CallType global;
using {_eqExecTypeGlobal as ==} for ExecType global;
using {_eqModeSelectorGlobal as ==} for ModeSelector global;
using {_eqModePayloadGlobal as ==} for ModePayload global;

function _eqCallTypeGlobal(CallType a, CallType b) pure returns (bool) {
    return CallType.unwrap(a) == CallType.unwrap(b);
}

function _eqExecTypeGlobal(ExecType a, ExecType b) pure returns (bool) {
    return ExecType.unwrap(a) == ExecType.unwrap(b);
}

function _eqModeSelectorGlobal(ModeSelector a, ModeSelector b) pure returns (bool) {
    return ModeSelector.unwrap(a) == ModeSelector.unwrap(b);
}

function _eqModePayloadGlobal(ModePayload a, ModePayload b) pure returns (bool) {
    return ModePayload.unwrap(a) == ModePayload.unwrap(b);
}
