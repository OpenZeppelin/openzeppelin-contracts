// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Counters.sol";

/**
 * @dev Todo
 */
abstract contract Nonces {
    using Counters for Counters.Counter;

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
}
