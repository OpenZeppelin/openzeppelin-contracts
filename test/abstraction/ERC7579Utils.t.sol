// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {ERC7579Utils, Execution, Mode, CallType, ExecType, ModeSelector, ModePayload} from "@openzeppelin/contracts/abstraction/utils/ERC7579Utils.sol";

contract ERC7579UtilsTest is Test {
    using ERC7579Utils for *;

    function testEncodeDecodeMode(
        CallType callType,
        ExecType execType,
        ModeSelector modeSelector,
        ModePayload modePayload
    ) public {
        (CallType callType2, ExecType execType2, ModeSelector modeSelector2, ModePayload modePayload2) = ERC7579Utils
            .encodeMode(callType, execType, modeSelector, modePayload)
            .decodeMode();

        assertTrue(callType == callType2);
        assertTrue(execType == execType2);
        assertTrue(modeSelector == modeSelector2);
        assertTrue(modePayload == modePayload2);
    }

    function testEncodeDecodeSingle(address target, uint256 value, bytes memory callData) public {
        (address target2, uint256 value2, bytes memory callData2) = this._decodeSingle(
            ERC7579Utils.encodeSingle(target, value, callData)
        );

        assertEq(target, target2);
        assertEq(value, value2);
        assertEq(callData, callData2);
    }

    function testEncodeDecodeDelegate(address target, bytes memory callData) public {
        (address target2, bytes memory callData2) = this._decodeDelegate(ERC7579Utils.encodeDelegate(target, callData));

        assertEq(target, target2);
        assertEq(callData, callData2);
    }

    function testEncodeDecodeBatch(Execution[] memory executionBatch) public {
        Execution[] memory executionBatch2 = this._decodeBatch(ERC7579Utils.encodeBatch(executionBatch));

        assertEq(abi.encode(executionBatch), abi.encode(executionBatch2));
    }

    function _decodeSingle(
        bytes calldata executionCalldata
    ) external pure returns (address target, uint256 value, bytes calldata callData) {
        return ERC7579Utils.decodeSingle(executionCalldata);
    }

    function _decodeDelegate(
        bytes calldata executionCalldata
    ) external pure returns (address target, bytes calldata callData) {
        return ERC7579Utils.decodeDelegate(executionCalldata);
    }

    function _decodeBatch(
        bytes calldata executionCalldata
    ) external pure returns (Execution[] calldata executionBatch) {
        return ERC7579Utils.decodeBatch(executionCalldata);
    }
}
