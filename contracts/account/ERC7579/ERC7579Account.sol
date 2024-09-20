// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "../Account.sol";
import {Address} from "../../utils/Address.sol";
import {IERC7579AccountConfig} from "../../interfaces/IERC7579Account.sol";
import {MODULE_TYPE_VALIDATOR, MODULE_TYPE_EXECUTOR, MODULE_TYPE_FALLBACK, MODULE_TYPE_HOOK} from "../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, Mode, CallType} from "./utils/ERC7579Utils.sol";
import {ERC7579ModuleConfig} from "./ERC7579ModuleConfig.sol";
import {ERC7579Execution} from "./ERC7579Execution.sol";

abstract contract ERC7579Account is Account, ERC7579Execution, ERC7579ModuleConfig, IERC7579AccountConfig {
    using ERC7579Utils for *;

    /// @inheritdoc IERC7579AccountConfig
    function accountId() public view virtual returns (string memory) {
        //vendorname.accountname.semver
        return "@openzeppelin/contracts.erc7579account.v0-beta";
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsExecutionMode(bytes32 encodedMode) public view virtual returns (bool) {
        (CallType callType, , , ) = Mode.wrap(encodedMode).decodeMode();
        return
            callType == ERC7579Utils.CALLTYPE_SINGLE ||
            callType == ERC7579Utils.CALLTYPE_BATCH ||
            callType == ERC7579Utils.CALLTYPE_DELEGATECALL;
    }

    /// @inheritdoc IERC7579AccountConfig
    function supportsModule(uint256 moduleTypeId) public view virtual returns (bool) {
        return
            moduleTypeId == MODULE_TYPE_VALIDATOR ||
            moduleTypeId == MODULE_TYPE_EXECUTOR ||
            moduleTypeId == MODULE_TYPE_FALLBACK;
    }
}
