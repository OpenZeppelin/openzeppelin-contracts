// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Governor} from "../Governor.sol";
import {Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {IERC7786GatewaySource} from "../../interfaces/draft-IERC7786.sol";

/// @dev Extension of {Governor} for cross-chain governance through ERC-7786 gateways and {CrosschainRemoteExecutor}.
abstract contract GovernorCrosschain is Governor {
    /// @dev Send crosschain instruction to an arbitrary remote executor via an arbitrary ERC-7786 gateway.
    function relayCrosschain(
        address gateway,
        bytes memory executor,
        Mode mode,
        bytes memory executionCalldata
    ) public virtual onlyGovernance {
        _crosschainExecute(gateway, executor, mode, executionCalldata);
    }

    /// @dev Send crosschain instruction to an arbitrary remote executor via an arbitrary ERC-7786 gateway.
    function _crosschainExecute(
        address gateway,
        bytes memory executor,
        Mode mode,
        bytes memory executionCalldata
    ) internal virtual {
        IERC7786GatewaySource(gateway).sendMessage(executor, abi.encodePacked(mode, executionCalldata), new bytes[](0));
    }
}
