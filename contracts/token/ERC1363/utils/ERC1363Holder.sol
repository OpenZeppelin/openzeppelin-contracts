// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC1363Receiver.sol";
import "../IERC1363Spender.sol";

/**
 * @dev Simple implementation of the {IERC1363Receiver} and {IERC1363Spender} interfaces that will allow a contract
 * to hold ERC1363 tokens.
 *
 * IMPORTANT: When inheriting this contract, you must include a way to use the received tokens, otherwise they will be
 * stuck.
 */
contract ERC1363Holder is IERC1363Receiver, IERC1363Spender {
    /*
     * @dev See {IERC1363Receiver-onTransferReceived}.
     *
     * Always returns `IERC1363Receiver.onTransferReceived.selector`.
     */
    function onTransferReceived(
        address,
        address,
        uint256,
        bytes memory
    ) external virtual override returns (bytes4) {
        return IERC1363Receiver.onTransferReceived.selector;
    }

    /*
     * @dev See {IERC1363Spender-onApprovalReceived}.
     *
     * Always returns `IERC1363Spender.onApprovalReceived.selector`.
     */
    function onApprovalReceived(
        address,
        uint256,
        bytes memory
    ) external virtual override returns (bytes4) {
        return IERC1363Spender.onApprovalReceived.selector;
    }
}
