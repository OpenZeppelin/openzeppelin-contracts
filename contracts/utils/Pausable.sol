// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

import {Context} from "../utils/Context.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;
    string private _pauseReason;

    /**
     * @dev Emitted when the pause is triggered by `account` with an optional reason.
     */
    event Paused(address account, string reason);

    /**
     * @dev Emitted when the pause is lifted by `account` with an optional reason.
     */
    event Unpaused(address account, string reason);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause(string reason);

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Returns the reason why the contract is paused, empty if not paused.
     */
    function pauseReason() public view virtual returns (string memory) {
        return _pauseReason;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause(_pauseReason);
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state with a reason string.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause(string memory reason) internal virtual whenNotPaused {
        _paused = true;
        _pauseReason = reason;
        emit Paused(_msgSender(), reason);
    }

    /**
     * @dev Returns to normal state with a reason string.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause(string memory reason) internal virtual whenPaused {
        _paused = false;
        _pauseReason = "";
        emit Unpaused(_msgSender(), reason);
    }

    /**
     * @dev Backward compatibility: Triggers stopped state without a reason.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _pause("");
    }

    /**
     * @dev Backward compatibility: Returns to normal state without a reason.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _unpause("");
    }
}
