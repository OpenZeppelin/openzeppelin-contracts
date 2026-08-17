// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (governance/extensions/GovernorCrosschain.sol)

pragma solidity ^0.8.26;

import {Governor} from "../Governor.sol";
import {Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {IERC7786GatewaySource} from "../../interfaces/draft-IERC7786.sol";

/// @dev Extension of {Governor} for cross-chain governance through ERC-7786 gateways and {CrosschainRemoteExecutor}.
abstract contract GovernorCrosschain is Governor {
    /// @dev Emitted when a crosschain instruction is relayed to a remote executor.
    event CrosschainInstructionRelayed(bytes32 indexed sendId, address indexed gateway, bytes executor);

    /**
     * @dev Send crosschain instruction to an arbitrary remote executor via an arbitrary ERC-7786 gateway.
     *
     * Any value sent with this call is forwarded to the gateway. Some gateways require it as a message fee.
     *
     * Returns the `sendId` reported by the gateway. A non-zero value means the message requires further,
     * gateway specific, processing before it is delivered to the destination chain.
     */
    function relayCrosschain(
        address gateway,
        bytes memory executor,
        Mode mode,
        bytes memory executionCalldata
    ) public payable virtual onlyGovernance returns (bytes32) {
        return _crosschainExecute(gateway, executor, mode, executionCalldata, msg.value);
    }

    /**
     * @dev Send crosschain instruction to an arbitrary remote executor via an arbitrary ERC-7786 gateway, forwarding
     * `value` to the gateway. Emits a {CrosschainInstructionRelayed} event and returns the gateway's `sendId`.
     */
    function _crosschainExecute(
        address gateway,
        bytes memory executor,
        Mode mode,
        bytes memory executionCalldata,
        uint256 value
    ) internal virtual returns (bytes32 sendId) {
        sendId = IERC7786GatewaySource(gateway).sendMessage{value: value}(
            executor,
            abi.encodePacked(mode, executionCalldata),
            new bytes[](0)
        );
        emit CrosschainInstructionRelayed(sendId, gateway, executor);
    }
}
