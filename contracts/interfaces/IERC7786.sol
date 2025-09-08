// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for ERC-7786 Remote Procedure Call.
 * See https://eips.ethereum.org/EIPS/eip-7786
 */
interface IERC7786 {
    /**
     * @dev Executes a call to `target` with `data`.
     * Returns the success status and return data.
     */
    function execute(address target, bytes calldata data) external returns (bool success, bytes memory result);
}
