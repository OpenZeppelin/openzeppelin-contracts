// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {_eqCallTypeGlobal, _eqExecTypeGlobal, _eqModeSelectorGlobal, _eqModePayloadGlobal, CallType, ExecType, ModeSelector, ModePayload} from "../../../account/utils/draft-ERC7579Utils.sol";

contract ERC7579UtilsGlobalMock {
    function eqCallTypeGlobal(CallType callType1, CallType callType2) internal pure returns (bool) {
        return _eqCallTypeGlobal(callType1, callType2);
    }

    function eqExecTypeGlobal(ExecType execType1, ExecType execType2) internal pure returns (bool) {
        return _eqExecTypeGlobal(execType1, execType2);
    }

    function eqModeSelectorGlobal(ModeSelector modeSelector1, ModeSelector modeSelector2) internal pure returns (bool) {
        return _eqModeSelectorGlobal(modeSelector1, modeSelector2);
    }

    function eqModePayloadGlobal(ModePayload modePayload1, ModePayload modePayload2) internal pure returns (bool) {
        return _eqModePayloadGlobal(modePayload1, modePayload2);
    }
}
