// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to functions.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note: functions marked as `nonReentrant` with same `level`
 * may not call one another. 
 *
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 0;
    uint256 private constant _ENTERED = 1;
    
    // As uninitialized values are always 0
    // that means each level _status will be _NOT_ENTERED by default
    mapping(uint256 => uint256) private _status;

    constructor () {
        
    }

    /**
     * nonReentrant functions with same level will be prevented from executing reentrantly.
     * nonReentrant functions with different level can be executed reentrantly.
     */
    modifier nonReentrant(uint256 _level) {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status[_level] != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant with level as "_level" after this point will fail
        _status[_level] = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status[_level] = _NOT_ENTERED;
    }
}
