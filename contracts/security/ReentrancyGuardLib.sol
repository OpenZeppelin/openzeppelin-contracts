// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (security/ReentrancyGuardLib.sol)

pragma solidity ^0.8.0;

/**
 * @dev Library that helps prevent reentrant calls to a function.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
library ReentrancyGuardLib {
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
    uint256 private constant _NOT_INITIALIZED = 0;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    struct Data {
        uint256 _status;
    }

    function init(Data storage self) internal {
        require(self._status == _NOT_INITIALIZED, "ReentrancyGuard: init already called");
        self._status = _NOT_ENTERED;
    }

    function enter(Data storage self) internal {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(self._status == _NOT_ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        self._status = _ENTERED;
    }

    function leave(Data storage self) internal {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        self._status = _NOT_ENTERED;
    }

    function entered(Data storage self) internal view returns (bool) {
        return self._status == _ENTERED;
    }
}
