// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

import "./ReentrancyGuardLib.sol";

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    using ReentrancyGuardLib for ReentrancyGuardLib.Data;

    ReentrancyGuardLib.Data private _guard;

    constructor() {
        _guard.init();
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _guard.enter();
        _;
        _guard.leave();
    }

    /**
     * @dev Prevents a contract from calling itself, this method only checks
     * if the contract is already entered and not actually entering it.
     * Can be used with view functions.
     */
    modifier nonReentrantView() {
        require(!_guard.entered(), "ReentrancyGuard: reentrant call");
        _;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrantGuard(ReentrancyGuardLib.Data storage guard) {
        guard.enter();
        _;
        guard.leave();
    }

    /**
     * @dev Prevents a contract from calling itself, this method only checks
     * if the contract is already entered and not actually entering it.
     * Can be used with view functions.
     */
    modifier nonReentrantGuardView(ReentrancyGuardLib.Data storage guard) {
        require(!guard.entered(), "ReentrancyGuard: reentrant call");
        _;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _guard.entered();
    }
}
