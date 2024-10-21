// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Nonces} from "./Nonces.sol";

/**
 * @dev Alternative to {Nonces}, that support key-ed nonces.
 *
 * Follows the https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337's semi-abstracted nonce system].
 */
abstract contract NoncesSemiAbstracted is Nonces {
    mapping(address owner => mapping(uint192 key => uint64)) private _nonce;

    /**
     * @dev Returns the next unused nonce for an address.
     */
    function nonces(address owner) public view virtual override returns (uint256) {
        return nonces(owner, 0);
    }

    /**
     * @dev Returns the next unused nonce for an address and key. Result contains the key prefix.
     */
    function nonces(address owner, uint192 key) public view virtual returns (uint256) {
        return (uint256(key) << 64) | _nonce[owner][key];
    }

    /**
     * @dev Consumes a nonce from the default key.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner) internal virtual override returns (uint256) {
        return _useNonce(owner, 0);
    }

    /**
     * @dev Consumes a nonce from the given key.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner, uint192 key) internal virtual returns (uint256) {
        // TODO: use unchecked here? Do we expect 2**64 nonce ever be used for a single owner?
        return _nonce[owner][key]++;
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes a the key and the nonce in a single uint256 parameter:
     * - use the first 8 bytes for the key
     * - use the last 24 bytes for the nonce
     */
    function _useCheckedNonce(address owner, uint256 keyNonce) internal virtual override {
        _useCheckedNonce(owner, uint192(keyNonce >> 64), uint64(keyNonce));
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes a the key and the nonce as two different parameters.
     */
    function _useCheckedNonce(address owner, uint192 key, uint64 nonce) internal virtual {
        uint256 current = _useNonce(owner, key);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
    }
}
