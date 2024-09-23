// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7579Execution} from "../../interfaces/IERC7579Account.sol";
import {IERC7579Module, MODULE_TYPE_EXECUTOR} from "../../interfaces/IERC7579Module.sol";
import {ERC7579Utils, Execution, Mode} from "../utils/ERC7579Utils.sol";

abstract contract ERC7579Executor is IERC7579Module {
    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_EXECUTOR;
    }

    function _executeSingle(
        Mode mode,
        address account,
        address target,
        uint256 value,
        bytes memory data
    ) internal virtual {
        IERC7579Execution(account).executeFromExecutor(
            Mode.unwrap(mode),
            ERC7579Utils.encodeSingle(target, value, data)
        );
    }

    function _executeBatch(
        Mode mode,
        address account,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory datas
    ) internal virtual {
        Execution[] memory executions = new Execution[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            executions[i] = Execution(targets[i], values[i], datas[i]);
        }
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeBatch(executions));
    }

    function _executeDelegate(Mode mode, address account, address target, bytes memory data) internal virtual {
        IERC7579Execution(account).executeFromExecutor(Mode.unwrap(mode), ERC7579Utils.encodeDelegate(target, data));
    }
}
