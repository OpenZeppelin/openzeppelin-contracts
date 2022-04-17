// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (security/FlashLoanGuard.sol)
/**
 * @dev Contract module that helps prevent critial actions from
 * happening in the same block, which may result in flash loan attacks.
 * Inheriting from `FlashLoanGuard` will make the {flasLoanGuard} modifier
 * available, which can be applied to functions to make sure they can only happen
 * in subsequent blocks, preventing flash loan attacks.
 *
 * https://blog.openzeppelin.com/flash-loans-and-the-advent-of-episodic-finance/
 */

pragma solidity ^0.8.0;

abstract contract FlashLoanGuard {
    uint256 _lastActionTimestamp;

    /**
     * @dev Initializes the contract with lastActionTimestamp set to
     * deploymeny yime
     */
    constructor() {
        _lastActionTimestamp = block.timestamp;
    }

    /** @dev Guards against subsequent `flashLoanGuard`
     * actions from happening in the same block
     */
    modifier flashLoanGuard() {
        require(block.timestamp - _lastActionTimestamp > 0, "FlashLoanGuard: too many calls in same block");
        _lastActionTimestamp = block.timestamp;
        _;
    }
}
