// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Counters.sol";

/**
 * @dev Provides tracking nonces for addresses. Nonces will only increment.
 */
abstract contract Nonces {
    using Counters for Counters.Counter;

    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidAccountNonce(address account, uint256 currentNonce);

    mapping(address => Counters.Counter) private _nonces;

    /**
     * @dev Returns an address nonce.
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     */
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual returns (uint256 current) {
        current = _useNonce(owner);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
    }
}
