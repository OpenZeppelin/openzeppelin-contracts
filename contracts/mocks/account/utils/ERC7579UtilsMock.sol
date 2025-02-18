// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {CallType, ExecType, ModeSelector, ModePayload} from "../../../account/utils/draft-ERC7579Utils.sol";

contract ERC7579UtilsGlobalMock {
    function eqCallTypeGlobal(CallType callType1, CallType callType2) internal pure returns (bool) {
        return callType1 == callType2;
    }

    function eqExecTypeGlobal(ExecType execType1, ExecType execType2) internal pure returns (bool) {
        return execType1 == execType2;
    }

    function eqModeSelectorGlobal(ModeSelector modeSelector1, ModeSelector modeSelector2) internal pure returns (bool) {
        return modeSelector1 == modeSelector2;
    }

    function eqModePayloadGlobal(ModePayload modePayload1, ModePayload modePayload2) internal pure returns (bool) {
        return modePayload1 == modePayload2;
    }
}
