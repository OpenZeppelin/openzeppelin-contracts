// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Nonces} from "./Nonces.sol";

/**
 * @dev Alternative to {Nonces}, that support key-ed nonces.
 *
 * Follows the https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337's semi-abstracted nonce system].
 */
abstract contract NoncesKeyed is Nonces {
    mapping(address owner => mapping(uint192 key => uint64)) private _nonces;

    /// @dev Returns the next unused nonce for an address and key. Result contains the key prefix.
    function nonces(address owner, uint192 key) public view virtual returns (uint256) {
        return key == 0 ? nonces(owner) : ((uint256(key) << 64) | _nonces[owner][key]);
    }

    /**
     * @dev Consumes the next unused nonce for an address and key.
     *
     * Returns the current value without the key prefix. Consumed nonce is increased, so calling this functions twice
     * with the same arguments will return different (sequential) results.
     */
    function _useNonce(address owner, uint192 key) internal virtual returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return key == 0 ? _useNonce(owner) : _nonces[owner][key]++;
        }
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes the key and the nonce in a single uint256 parameter:
     * - use the first 8 bytes for the key
     * - use the last 24 bytes for the nonce
     */
    function _useCheckedNonce(address owner, uint256 keyNonce) internal virtual override {
        _useCheckedNonce(owner, uint192(keyNonce >> 64), uint64(keyNonce));
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes the key and the nonce as two different parameters.
     */
    function _useCheckedNonce(address owner, uint192 key, uint64 nonce) internal virtual {
        if (key == 0) {
            super._useCheckedNonce(owner, nonce);
        } else {
            uint256 current = _useNonce(owner, key);
            if (nonce != current) {
                revert InvalidAccountNonce(owner, current);
            }
        }
    }
}
