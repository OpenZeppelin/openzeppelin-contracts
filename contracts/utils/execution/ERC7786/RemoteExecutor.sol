// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../../../access/Ownable.sol";
import {IERC7786} from "../../../interfaces/IERC7786.sol";

/**
 * @title RemoteExecutor
 * @dev Implementation of ERC-7786 that allows the owner to execute arbitrary calls on other contracts.
 * 
 * This contract provides a simple interface for forwarding execution calls to other contracts.
 * Only the contract owner can execute calls for security reasons.
 *
 * See https://eips.ethereum.org/EIPS/eip-7786
 */
contract RemoteExecutor is IERC7786, Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Executes a call to `target` with `data`.
     * 
     * Requirements:
     * - The caller must be the contract owner
     * - `target` must not be the zero address
     * - The call to `target` must succeed (otherwise this function reverts and bubbles the target's revert reason when available)
     *
     * @param target The address of the contract to call
     * @param data The call data to send
     * @return success Whether the call succeeded (always true if function returns)
     * @return result The return data from the call
     */
    function execute(address target, bytes calldata data)
        external
        override
        onlyOwner
        returns (bool success, bytes memory result)
    {
        require(target != address(0), "RemoteExecutor: target is zero address");
        (success, result) = target.call(data);
        if (!success) {
            // Bubble up revert reason from target contract if present
            if (result.length > 0) {
                // The easiest way to bubble the revert reason is using assembly
                assembly {
                    let returndata_size := mload(result)
                    revert(add(result, 32), returndata_size)
                }
            } else {
                revert("RemoteExecutor: call failed");
            }
        }
    }
}