// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Governor} from "../Governor.sol";
import {Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {ERC7786Recipient} from "../../crosschain/ERC7786Recipient.sol";
import {IERC7786GatewaySource} from "../../interfaces/draft-IERC7786.sol";
import {Bytes} from "../../utils/Bytes.sol";
import {InteroperableAddress} from "../../utils/draft-InteroperableAddress.sol";

/// @dev Extension of {Governor} for cross-chain governance through ERC-7786 gateways and {CrosschainRemoteExecutors}.
abstract contract GovernorCrosschain is Governor {
    using Bytes for bytes;
    using InteroperableAddress for bytes;

    struct ExecutorDetails {
        address gateway;
        bytes executor;
    }

    mapping(bytes chain => ExecutorDetails) private _remoteExecutors;

    /**
     * @dev Emitted when a new remote executor is registered.
     *
     * Note: the `executor` argument is a full InteroperableAddress (chain ref + address).
     */
    event RemoteExecutorRegistered(address gateway, bytes executor);

    /**
     * @dev Reverted when trying to register a link for a chain that is already registered.
     *
     * Note: the `chain` argument is a "chain-only" InteroperableAddress (empty address).
     */
    error RemoteExecutorAlreadyRegistered(bytes chain);

    /**
     * @dev Reverted when trying to send a crosschain instruction to a chain with no registered executor.
     */
    error NoExecutorRegistered(bytes chain);

    /**
     * @dev Returns the ERC-7786 gateway used for sending and receiving cross-chain messages to a given chain.
     *
     * Note: The `chain` parameter is a "chain-only" InteroperableAddress (empty address) and the `counterpart` returns
     * the full InteroperableAddress (chain ref + address) that is on `chain`.
     */
    function getRemoteExecutor(
        bytes memory chain
    ) public view virtual returns (address gateway, bytes memory executor) {
        ExecutorDetails storage self = _remoteExecutors[chain];
        return (self.gateway, self.executor);
    }

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

    /// @dev Send crosschain instruction to a the canonical remote executor of a given chain.
    function _crosschainExecute(bytes memory chain, Mode mode, bytes memory executionCalldata) internal virtual {
        (address gateway, bytes memory executor) = getRemoteExecutor(chain);
        require(gateway != address(0), NoExecutorRegistered(chain));
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

    /// @dev Register the canonical remote executor for a given chain.
    function registerRemoteExecutor(address gateway, bytes memory executor) public virtual onlyGovernance {
        _registerRemoteExecutor(gateway, executor, true);
    }

    /**
     * @dev Internal setter to change the ERC-7786 gateway and executor for a given chain. Called at construction.
     *
     * Note: The `executor` parameter is the full InteroperableAddress (chain ref + address).
     */
    function _registerRemoteExecutor(address gateway, bytes memory executor, bool allowOverride) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, an EOA would fail that test (nothing returned).
        IERC7786GatewaySource(gateway).supportsAttribute(bytes4(0));

        (bytes2 chainType, bytes memory chainReference, ) = executor.parseV1();
        bytes memory chain = InteroperableAddress.formatV1(chainType, chainReference, hex"");
        if (allowOverride || _remoteExecutors[chain].gateway == address(0)) {
            _remoteExecutors[chain] = ExecutorDetails(gateway, executor);
            emit RemoteExecutorRegistered(gateway, executor);
        } else {
            revert RemoteExecutorAlreadyRegistered(chain);
        }
    }
}
