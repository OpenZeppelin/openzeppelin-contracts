// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

/**
 * @dev Pausable Errors library. Kept separate from {Pausable} to avoid
 * an identifier clash with {Pausable}'s event identifiers.
 */
library PausableErrors {
    /**
     * @dev The contract is paused.
     */
    error Paused();

    /**
     * @dev The contract is not paused.
     */
    error Unpaused();
}
