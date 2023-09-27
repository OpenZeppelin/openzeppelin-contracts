// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC1363Receiver} from "../../../interfaces/IERC1363Receiver.sol";
import {IERC1363Spender} from "../../../interfaces/IERC1363Spender.sol";

/**
 * @title ERC1363Holder
 * @dev Implementation of `IERC1363Receiver` and `IERC1363Spender` that will allow a contract to receive ERC1363 token
 * transfers or approval.
 *
 * IMPORTANT: When inheriting this contract, you must include a way to use the received tokens or spend the allowance,
 * otherwise they will be stuck.
 */
abstract contract ERC1363Holder is IERC1363Receiver, IERC1363Spender {
    /*
     * NOTE: always returns `IERC1363Receiver.onTransferReceived.selector`.
     * @inheritdoc IERC1363Receiver
     */
    function onTransferReceived(address, address, uint256, bytes calldata) public virtual override returns (bytes4) {
        return this.onTransferReceived.selector;
    }

    /*
     * NOTE: always returns `IERC1363Spender.onApprovalReceived.selector`.
     * @inheritdoc IERC1363Spender
     */
    function onApprovalReceived(address, uint256, bytes calldata) public virtual override returns (bytes4) {
        return this.onApprovalReceived.selector;
    }
}
