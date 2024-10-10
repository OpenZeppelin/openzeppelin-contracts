// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Execution} from "../../interfaces/draft-IERC7579.sol";
import {Packing} from "../../utils/Packing.sol";
import {Address} from "../../utils/Address.sol";

type Mode is bytes32;
type CallType is bytes1;
type ExecType is bytes1;
type ModeSelector is bytes4;
type ModePayload is bytes22;

/**
 * @dev Library with common ERC-7579 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-7579[ERC-7579].
 */
// slither-disable-next-line unused-state
library ERC7579Utils {
    using Packing for *;

    /// @dev A single `call` execution.
    CallType constant CALLTYPE_SINGLE = CallType.wrap(0x00);

    /// @dev A batch of `call` executions.
    CallType constant CALLTYPE_BATCH = CallType.wrap(0x01);

    /// @dev A `delegatecall` execution.
    CallType constant CALLTYPE_DELEGATECALL = CallType.wrap(0xFF);

    /// @dev Default execution type that reverts on failure.
    ExecType constant EXECTYPE_DEFAULT = ExecType.wrap(0x00);

    /// @dev Execution type that does not revert on failure.
    ExecType constant EXECTYPE_TRY = ExecType.wrap(0x01);

    /// @dev Emits when an {EXECTYPE_TRY} execution fails.
    event ERC7579TryExecuteFail(uint256 batchExecutionIndex, bytes result);

    /// @dev The provided {CallType} is not supported.
    error ERC7579UnsupportedCallType(CallType callType);

    /// @dev The provided {ExecType} is not supported.
    error ERC7579UnsupportedExecType(ExecType execType);

    /// @dev The provided module doesn't match the provided module type.
    error ERC7579MismatchedModuleTypeId(uint256 moduleTypeId, address module);

    /// @dev The module is not installed.
    error ERC7579UninstalledModule(uint256 moduleTypeId, address module);

    /// @dev The module is already installed.
    error ERC7579AlreadyInstalledModule(uint256 moduleTypeId, address module);

    /// @dev The module type is not supported.
    error ERC7579UnsupportedModuleType(uint256 moduleTypeId);

    /// @dev Executes a single call.
    function execSingle(
        ExecType execType,
        bytes calldata executionCalldata
    ) internal returns (bytes[] memory returnData) {
        (address target, uint256 value, bytes calldata callData) = decodeSingle(executionCalldata);
        returnData = new bytes[](1);
        returnData[0] = _call(0, execType, target, value, callData);
    }

    /// @dev Executes a batch of calls.
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

    /// @dev Executes a delegate call.
    function execDelegateCall(
        ExecType execType,
        bytes calldata executionCalldata
    ) internal returns (bytes[] memory returnData) {
        (address target, bytes calldata callData) = decodeDelegate(executionCalldata);
        returnData = new bytes[](1);
        returnData[0] = _delegatecall(0, execType, target, callData);
    }

    /// @dev Encodes the mode with the provided parameters. See {decodeMode}.
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

    /// @dev Decodes the mode into its parameters. See {encodeMode}.
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

    /// @dev Encodes a single call execution. See {decodeSingle}.
    function encodeSingle(
        address target,
        uint256 value,
        bytes calldata callData
    ) internal pure returns (bytes memory executionCalldata) {
        return abi.encodePacked(target, value, callData);
    }

    /// @dev Decodes a single call execution. See {encodeSingle}.
    function decodeSingle(
        bytes calldata executionCalldata
    ) internal pure returns (address target, uint256 value, bytes calldata callData) {
        target = address(bytes20(executionCalldata[0:20]));
        value = uint256(bytes32(executionCalldata[20:52]));
        callData = executionCalldata[52:];
    }

    /// @dev Encodes a delegate call execution. See {decodeDelegate}.
    function encodeDelegate(
        address target,
        bytes calldata callData
    ) internal pure returns (bytes memory executionCalldata) {
        return abi.encodePacked(target, callData);
    }

    /// @dev Decodes a delegate call execution. See {encodeDelegate}.
    function decodeDelegate(
        bytes calldata executionCalldata
    ) internal pure returns (address target, bytes calldata callData) {
        target = address(bytes20(executionCalldata[0:20]));
        callData = executionCalldata[20:];
    }

    /// @dev Encodes a batch of executions. See {decodeBatch}.
    function encodeBatch(Execution[] memory executionBatch) internal pure returns (bytes memory executionCalldata) {
        return abi.encode(executionBatch);
    }

    /// @dev Decodes a batch of executions. See {encodeBatch}.
    function decodeBatch(bytes calldata executionCalldata) internal pure returns (Execution[] calldata executionBatch) {
        assembly ("memory-safe") {
            let ptr := add(executionCalldata.offset, calldataload(executionCalldata.offset))
            // Extract the ERC7579 Executions
            executionBatch.offset := add(ptr, 32)
            executionBatch.length := calldataload(ptr)
        }
    }

    /// @dev Executes a `call` to the target with the provided {ExecType}.
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

    /// @dev Executes a `delegatecall` to the target with the provided {ExecType}.
    function _delegatecall(
        uint256 index,
        ExecType execType,
        address target,
        bytes calldata data
    ) private returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return _validateExecutionMode(index, execType, success, returndata);
    }

    /// @dev Validates the execution mode and returns the returndata.
    function _validateExecutionMode(
        uint256 index,
        ExecType execType,
        bool success,
        bytes memory returndata
    ) private returns (bytes memory) {
        if (execType == ERC7579Utils.EXECTYPE_DEFAULT) {
            Address.verifyCallResult(success, returndata);
        } else if (execType == ERC7579Utils.EXECTYPE_TRY) {
            if (!success) emit ERC7579TryExecuteFail(index, returndata);
        } else {
            revert ERC7579UnsupportedExecType(execType);
        }
        return returndata;
    }
}

// Operators
using {eqCallType as ==} for CallType global;
using {eqExecType as ==} for ExecType global;
using {eqModeSelector as ==} for ModeSelector global;
using {eqModePayload as ==} for ModePayload global;

/// @dev Compares two `CallType` values for equality.
function eqCallType(CallType a, CallType b) pure returns (bool) {
    return CallType.unwrap(a) == CallType.unwrap(b);
}

/// @dev Compares two `ExecType` values for equality.
function eqExecType(ExecType a, ExecType b) pure returns (bool) {
    return ExecType.unwrap(a) == ExecType.unwrap(b);
}

/// @dev Compares two `ModeSelector` values for equality.
function eqModeSelector(ModeSelector a, ModeSelector b) pure returns (bool) {
    return ModeSelector.unwrap(a) == ModeSelector.unwrap(b);
}

/// @dev Compares two `ModePayload` values for equality.
function eqModePayload(ModePayload a, ModePayload b) pure returns (bool) {
    return ModePayload.unwrap(a) == ModePayload.unwrap(b);
}
