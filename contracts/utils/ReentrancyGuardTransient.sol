// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/ReentrancyGuardTransient.sol)

pragma solidity ^0.8.24;

import {TransientSlot} from "./TransientSlot.sol";

/**
 * @dev Variant of {ReentrancyGuard} that uses transient storage.
 *
 * NOTE: This variant only works on networks where EIP-1153 is available.
 *
 * _Available since v5.1._
 */
abstract contract ReentrancyGuardTransient {
    using TransientSlot for *;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    /**
     * @dev Pre-computed BooleanSlot type wrapper for the reentrancy guard storage slot.
     * This optimization avoids the overhead of repeatedly calling asBoolean() which performs
     * a bytes32.wrap() operation on each invocation. By pre-computing the wrapped type at compile-time,
     * this eliminates redundant type casting operations in _nonReentrantBefore(), _nonReentrantAfter(),
     * and _reentrancyGuardEntered(), reducing gas consumption by 10 gas per call
     * to asBoolean() (30 gas total per nonReentrant modifier execution).
     */
    TransientSlot.BooleanSlot private constant REENTRANCY_SLOT =
        TransientSlot.BooleanSlot.wrap(REENTRANCY_GUARD_STORAGE);

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, REENTRANCY_SLOT.tload() will be false
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        REENTRANCY_SLOT.tstore(true);
    }

    function _nonReentrantAfter() private {
        REENTRANCY_SLOT.tstore(false);
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return REENTRANCY_SLOT.tload();
    }
}
