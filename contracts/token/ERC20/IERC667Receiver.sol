// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev Interface of the ERC667 standard as defined in the EIP.
 */
interface IERC667Receiver {
    /**
     * @dev Callback triggered by {IERC667-transferAndCall}. Can revert or
     * return false to reject transfer. This callback is triggered AFTER the
     * token are transfered and the corresponding balances have been updated.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     */
    function onTokenTransfer(address from, uint256 amount, bytes calldata data) external returns (bool success);
}
