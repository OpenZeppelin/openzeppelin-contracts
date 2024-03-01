// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Collection of standard custom error that are used in multiple contracts
 */
library Errors {
    /**
     * @dev The ETH balance of the account is not enough to perform the operation.
     */
    error InsufficientBalance(uint256 balance, uint256 needed);

    /**
     * @dev A call to an address target failed. The target may have reverted.
     */
    error FailedInnerCall();

    /**
     * @dev The deployment failed.
     */
    error FailedDeployment();
}