// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Counters.sol";

/**
 * @dev Provides tracking nonces for addresses. Nonces will only increment.
 */
library Nonces {
    using Counters for Counters.Counter;

    struct Data {
        mapping(address => Counters.Counter) _nonces;
    }

    /**
     * @dev Returns an address nonce.
     */
    function nonces(Data storage self, address owner) internal view returns (uint256) {
        return self._nonces[owner].current();
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function useNonce(Data storage self, address owner) internal returns (uint256 current) {
        Counters.Counter storage nonce = self._nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}
