// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (account/utils/draft-ERC7579Utils.sol)

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
    CallType internal constant CALLTYPE_SINGLE = CallType.wrap(0x00);

    /// @dev A batch of `call` executions.
    CallType internal constant CALLTYPE_BATCH = CallType.wrap(0x01);

    /// @dev A `delegatecall` execution.
    CallType internal constant CALLTYPE_DELEGATECALL = CallType.wrap(0xFF);

    /// @dev Default execution type that reverts on failure.
    ExecType internal constant EXECTYPE_DEFAULT = ExecType.wrap(0x00);

    /// @dev Execution type that does not revert on failure.
    ExecType internal constant EXECTYPE_TRY = ExecType.wrap(0x01);

    /**
     * @dev Emits when an {EXECTYPE_TRY} execution fails.
     * @param batchExecutionIndex The index of the failed call in the execution batch.
     * @param returndata The returned data from the failed call.
     */
    event ERC7579TryExecuteFail(uint256 batchExecutionIndex, bytes returndata);

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

    /// @dev Input calldata not properly formatted and possibly malicious.
    error ERC7579DecodingError();

    /// @dev Executes a single call.
    function execSingle(
        bytes calldata executionCalldata,
        ExecType execType
    ) internal returns (bytes[] memory returnData) {
        (address target, uint256 value, bytes calldata callData) = decodeSingle(executionCalldata);
        returnData = new bytes[](1);
        returnData[0] = _call(0, execType, target, value, callData);
    }

    /// @dev Executes a batch of calls.
    function execBatch(
        bytes calldata executionCalldata,
        ExecType execType
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
        bytes calldata executionCalldata,
        ExecType execType
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
            CallType.wrap(Packing.extract_32_1(Mode.unwrap(mode), 0x00)),
            ExecType.wrap(Packing.extract_32_1(Mode.unwrap(mode), 0x01)),
            ModeSelector.wrap(Packing.extract_32_4(Mode.unwrap(mode), 0x06)),
            ModePayload.wrap(Packing.extract_32_22(Mode.unwrap(mode), 0x0a))
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
        target = address(bytes20(executionCalldata[0x00:0x14]));
        value = uint256(bytes32(executionCalldata[0x14:0x34]));
        callData = executionCalldata[0x34:];
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
        target = address(bytes20(executionCalldata[0:0x14]));
        callData = executionCalldata[0x14:];
    }

    /// @dev Encodes a batch of executions. See {decodeBatch}.
    function encodeBatch(Execution[] memory executionBatch) internal pure returns (bytes memory executionCalldata) {
        return abi.encode(executionBatch);
    }

    /// @dev Decodes a batch of executions. See {encodeBatch}.
    ///
    /// NOTE: This function runs some checks and will throw a {ERC7579DecodingError} if the input is not properly formatted.
    function decodeBatch(bytes calldata executionCalldata) internal pure returns (Execution[] calldata executionBatch) {
        unchecked {
            uint256 bufferLength = executionCalldata.length;

            // Check executionCalldata is not empty.
            if (bufferLength < 0x20) revert ERC7579DecodingError();

            // Get the offset of the array (pointer to the array length).
            uint256 arrayLengthOffset = uint256(bytes32(executionCalldata[0x00:0x20]));

            // The array length (at arrayLengthOffset) should be 32 bytes long. We check that this is within the
            // buffer bounds. Since we know bufferLength is at least 32, we can subtract with no overflow risk.
            if (arrayLengthOffset > bufferLength - 0x20) revert ERC7579DecodingError();

            // Get the array length. arrayLengthOffset + 32 is bounded by bufferLength so it does not overflow.
            uint256 arrayLength = uint256(bytes32(executionCalldata[arrayLengthOffset:arrayLengthOffset + 0x20]));

            // Check that the buffer is long enough to store the array elements as "offset pointer":
            // - each element of the array is an "offset pointer" to the data.
            // - each "offset pointer" (to an array element) takes 32 bytes.
            // - validity of the calldata at that location is checked when the array element is accessed, so we only
            //   need to check that the buffer is large enough to hold the pointers.
            //
            // Since we know bufferLength is at least arrayLengthOffset + 32, we can subtract with no overflow risk.
            // Solidity limits length of such arrays to 2**64-1, this guarantees `arrayLength * 32` does not overflow.
            if (arrayLength > type(uint64).max || bufferLength - arrayLengthOffset - 0x20 < arrayLength * 0x20)
                revert ERC7579DecodingError();

            assembly ("memory-safe") {
                executionBatch.offset := add(add(executionCalldata.offset, arrayLengthOffset), 0x20)
                executionBatch.length := arrayLength
            }
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
        (bool success, bytes memory returndata) = (target == address(0) ? address(this) : target).call{value: value}(
            data
        );
        return _validateExecutionMode(index, execType, success, returndata);
    }

    /// @dev Executes a `delegatecall` to the target with the provided {ExecType}.
    function _delegatecall(
        uint256 index,
        ExecType execType,
        address target,
        bytes calldata data
    ) private returns (bytes memory) {
        (bool success, bytes memory returndata) = (target == address(0) ? address(this) : target).delegatecall(data);
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
