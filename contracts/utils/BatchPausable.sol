// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/BatchPausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface for pausable contracts that this utility can interact with.
 */
interface IPausableTarget {
    function paused() external view returns (bool);
    function pause() external;
    function unpause() external;
}

/**
 * @dev Utility contract for performing batch pause/unpause operations on multiple
 * pausable contracts in a single transaction.
 *
 *
 * Usage:
 * ```solidity
 * contract MyPauseManager {
 *     using BatchPausable for address[];
 *
 *     function emergencyPauseAll(address[] calldata contracts) external onlyOwner {
 *         contracts.batchPause();
 *     }
 * }
 * ```
 *
 * NOTE: This contract does not enforce access control. Callers must ensure proper
 * authorization before invoking batch operations.
 */
library BatchPausable {
    /**
     * @dev Emitted when a contract is successfully paused during a batch operation.
     */
    event BatchPaused(address indexed target);

    /**
     * @dev Emitted when a contract is successfully unpaused during a batch operation.
     */
    event BatchUnpaused(address indexed target);

    /**
     * @dev Emitted when a pause operation is skipped because the contract is already paused.
     */
    event PauseSkipped(address indexed target);

    /**
     * @dev Emitted when an unpause operation is skipped because the contract is already unpaused.
     */
    event UnpauseSkipped(address indexed target);

    /**
     * @dev Emitted when an operation fails on a target contract.
     */
    event OperationFailed(address indexed target, bytes reason);

    /**
     * @dev Pauses multiple contracts in a single transaction. Contracts that are already
     * paused are skipped without reverting, enabling safe usage even with duplicate addresses
     * or contracts in mixed states.
     *
     * Emits {BatchPaused} for each successfully paused contract.
     * Emits {PauseSkipped} for each already-paused contract.
     * Emits {OperationFailed} if the pause call fails for any reason.
     *
     * @param targets Array of pausable contract addresses to pause.
     */
    function batchPause(address[] memory targets) internal {
        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];

            // Skip if address has no code (EOA or destroyed contract)
            if (target.code.length == 0) {
                emit OperationFailed(target, "");
                continue;
            }

            IPausableTarget pausable = IPausableTarget(target);

            try pausable.paused() returns (bool isPaused) {
                if (!isPaused) {
                    try pausable.pause() {
                        emit BatchPaused(target);
                    } catch (bytes memory reason) {
                        emit OperationFailed(target, reason);
                    }
                } else {
                    emit PauseSkipped(target);
                }
            } catch (bytes memory reason) {
                emit OperationFailed(target, reason);
            }
        }
    }

    /**
     * @dev Unpauses multiple contracts in a single transaction. Contracts that are already
     * unpaused are skipped without reverting.
     *
     * Emits {BatchUnpaused} for each successfully unpaused contract.
     * Emits {UnpauseSkipped} for each already-unpaused contract.
     * Emits {OperationFailed} if the unpause call fails for any reason.
     *
     * @param targets Array of pausable contract addresses to unpause.
     */
    function batchUnpause(address[] memory targets) internal {
        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];

            // Skip if address has no code (EOA or destroyed contract)
            if (target.code.length == 0) {
                emit OperationFailed(target, "");
                continue;
            }

            IPausableTarget pausable = IPausableTarget(target);

            try pausable.paused() returns (bool isPaused) {
                if (isPaused) {
                    try pausable.unpause() {
                        emit BatchUnpaused(target);
                    } catch (bytes memory reason) {
                        emit OperationFailed(target, reason);
                    }
                } else {
                    emit UnpauseSkipped(target);
                }
            } catch (bytes memory reason) {
                emit OperationFailed(target, reason);
            }
        }
    }

    /**
     * @dev Returns the pause status of multiple contracts.
     *
     * @param targets Array of pausable contract addresses to query.
     * @return statuses Array of boolean values indicating pause status. Returns false if query fails.
     */
    function batchQueryPauseStatus(address[] memory targets) internal view returns (bool[] memory statuses) {
        statuses = new bool[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            // Return false if address has no code
            if (targets[i].code.length == 0) {
                statuses[i] = false;
                continue;
            }

            try IPausableTarget(targets[i]).paused() returns (bool isPaused) {
                statuses[i] = isPaused;
            } catch {
                statuses[i] = false; // Default to false if query fails
            }
        }
    }
}
