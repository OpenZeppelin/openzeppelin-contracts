// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (crosschain/CrosschainRemoteExecutor.sol)

pragma solidity ^0.8.27;

import {IERC7786GatewaySource} from "../interfaces/draft-IERC7786.sol";
import {ERC7786Recipient} from "./ERC7786Recipient.sol";
import {ERC7579Utils, Mode, CallType, ExecType} from "../account/utils/draft-ERC7579Utils.sol";
import {InteroperableAddress} from "../utils/draft-InteroperableAddress.sol";
import {Bytes} from "../utils/Bytes.sol";

/**
 * @dev Helper contract used to relay transactions received from a controller through an ERC-7786 gateway. This is
 * used by the {GovernorCrosschain} governance module for the execution of cross-chain actions.
 *
 * A {CrosschainRemoteExecutor} address can be seen as the local identity of a remote executor on another chain. It
 * holds assets and permissions for the sake of its controller.
 */
contract CrosschainRemoteExecutor is ERC7786Recipient {
    using Bytes for bytes;
    using ERC7579Utils for *;

    /// @dev Gateway used by the remote controller to relay instructions to this executor.
    address private _gateway;

    /// @dev InteroperableAddress of the remote controller that is allowed to relay instructions to this executor.
    bytes private _controller;

    /// @dev Emitted when the gateway or controller of this remote executor is updated.
    event CrosschainControllerSet(address gateway, bytes controller);

    /// @dev Reverted when a non-controller tries to relay instructions to this executor.
    error AccessRestricted();

    /// @dev Reverted when the controller is not a full interoperable address (chain reference and address).
    error InvalidController(bytes controller);

    constructor(address initialGateway, bytes memory initialController) {
        _setup(initialGateway, initialController);
    }

    /// @dev Accessor that returns the address of the gateway used by this remote executor.
    function gateway() public view virtual returns (address) {
        return _gateway;
    }

    /**
     * @dev Accessor that returns the interoperable address of the controller allowed to relay instructions to this
     * remote executor.
     */
    function controller() public view virtual returns (bytes memory) {
        return _controller;
    }

    /**
     * @dev Endpoint allowing the controller to reconfigure the executor. This must be called by the executor itself
     * following an instruction from the controller.
     */
    function reconfigure(address newGateway, bytes memory newController) public virtual {
        require(msg.sender == address(this), AccessRestricted());
        _setup(newGateway, newController);
    }

    /// @dev Internal setter to reconfigure the gateway and controller.
    function _setup(address gateway_, bytes memory controller_) internal virtual {
        // Sanity check, this should revert if gateway is not an ERC-7786 implementation. Note that since
        // supportsAttribute returns data, accounts without code would fail that test (nothing returned).
        IERC7786GatewaySource(gateway_).supportsAttribute(bytes4(0));

        // Sanity check, authorization in {_isAuthorizedGateway} is a strict byte comparison between the controller
        // and the sender reported by the gateway, which is always a full interoperable address. A controller that
        // is not one can never match, which would permanently lock this executor: {reconfigure} is only reachable
        // through a message from the controller, so neither the executor nor the assets it holds could be recovered.
        (, bytes memory chainReference, bytes memory addr) = InteroperableAddress.parseV1(controller_);
        require(chainReference.length > 0 && addr.length > 0, InvalidController(controller_));

        _gateway = gateway_;
        _controller = controller_;

        emit CrosschainControllerSet(gateway_, controller_);
    }

    /// @inheritdoc ERC7786Recipient
    function _isAuthorizedGateway(
        address instance,
        bytes calldata sender
    ) internal view virtual override returns (bool) {
        return gateway() == instance && controller().equal(sender);
    }

    /// @inheritdoc ERC7786Recipient
    function _processMessage(
        address /*gateway*/,
        bytes32 /*receiveId*/,
        bytes calldata /*sender*/,
        bytes calldata payload
    ) internal virtual override {
        // split payload
        (CallType callType, ExecType execType, , ) = Mode.wrap(bytes32(payload[0x00:0x20])).decodeMode();
        bytes calldata executionCalldata = payload[0x20:];

        if (callType == ERC7579Utils.CALLTYPE_SINGLE) {
            executionCalldata.execSingle(execType);
        } else if (callType == ERC7579Utils.CALLTYPE_BATCH) {
            executionCalldata.execBatch(execType);
        } else if (callType == ERC7579Utils.CALLTYPE_DELEGATECALL) {
            executionCalldata.execDelegateCall(execType);
        } else revert ERC7579Utils.ERC7579UnsupportedCallType(callType);
    }
}
