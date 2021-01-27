// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

/**
 * @dev Interface of the ERC667 standard as defined in the EIP.
 */
interface IERC667 {
    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient` and
     * call {IERC667Receiver-onTokenTransfer} on the recipient.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferAndCall(address receiver, uint amount, bytes calldata data) external returns (bool success);
}
