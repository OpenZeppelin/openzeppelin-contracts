// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";
import {Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {CrosschainRemoteController} from "../../crosschain/CrosschainRemoteController.sol";

/// @dev Extension of {Governor} for cross-chain governance through ERC-7786 gateways and {CrosschainRemoteExecutors}.
abstract contract GovernorCrosschain is Governor, CrosschainRemoteController {
    /// @dev Send crosschain instruction to a the canonical remote executor of a given chain.
    function relayCrosschain(
        bytes memory chain,
        Mode mode,
        bytes memory executionCalldata
    ) public virtual onlyGovernance {
        _crosschainExecute(chain, mode, executionCalldata);
    }

    /// @dev Send crosschain instruction to an arbitrary remote executor via an arbitrary ERC-7786 gateway.
    function relayCrosschain(
        address gateway,
        bytes memory executor,
        Mode mode,
        bytes memory executionCalldata
    ) public virtual onlyGovernance {
        _crosschainExecute(gateway, executor, mode, executionCalldata);
    }

    /// @dev Register the canonical remote executor for a given chain.
    function registerRemoteExecutor(address gateway, bytes memory executor) public virtual onlyGovernance {
        _registerRemoteExecutor(gateway, executor, true);
    }
}
