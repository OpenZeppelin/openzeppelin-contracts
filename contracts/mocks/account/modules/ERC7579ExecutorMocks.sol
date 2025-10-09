// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {ERC7579Executor} from "../../../account/modules/ERC7579Executor.sol";
import {ERC7579DelayedExecutor} from "../../../account/modules/ERC7579DelayedExecutor.sol";

abstract contract ERC7579ExecutorMock is ERC7579Executor {
    function onInstall(bytes calldata data) external {}

    function onUninstall(bytes calldata data) external {}

    function _validateExecution(
        address,
        bytes32,
        bytes32,
        bytes calldata data
    ) internal pure override returns (bytes calldata) {
        return data;
    }
}

abstract contract ERC7579DelayedExecutorMock is ERC7579DelayedExecutor {
    function _validateSchedule(address account, bytes32, bytes32, bytes calldata) internal view override {
        require(msg.sender == account);
    }

    function _validateCancel(address account, bytes32, bytes32, bytes calldata) internal view override {
        require(msg.sender == account);
    }
}
