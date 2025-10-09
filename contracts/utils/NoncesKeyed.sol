// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (utils/NoncesKeyed.sol)
pragma solidity ^0.8.20;

import {Nonces} from "./Nonces.sol";

/**
 * @dev Alternative to {Nonces}, that supports key-ed nonces.
 *
 * Follows the https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337's semi-abstracted nonce system].
 *
 * NOTE: This contract inherits from {Nonces} and reuses its storage for the first nonce key (i.e. `0`). This
 * makes upgrading from {Nonces} to {NoncesKeyed} safe when using their upgradeable versions (e.g. `NoncesKeyedUpgradeable`).
 * Doing so will NOT reset the current state of nonces, avoiding replay attacks where a nonce is reused after the upgrade.
 */
abstract contract NoncesKeyed is Nonces {
    mapping(address owner => mapping(uint192 key => uint64)) private _nonces;

    /// @dev Returns the next unused nonce for an address and key. Result contains the key prefix.
    function nonces(address owner, uint192 key) public view virtual returns (uint256) {
        return key == 0 ? nonces(owner) : _pack(key, _nonces[owner][key]);
    }

    /**
     * @dev Consumes the next unused nonce for an address and key.
     *
     * Returns the current value without the key prefix. Consumed nonce is increased, so calling this function twice
     * with the same arguments will return different (sequential) results.
     */
    function _useNonce(address owner, uint192 key) internal virtual returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return key == 0 ? _useNonce(owner) : _pack(key, _nonces[owner][key]++);
        }
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes the key and the nonce in a single uint256 parameter:
     * - use the first 24 bytes for the key
     * - use the last 8 bytes for the nonce
     */
    function _useCheckedNonce(address owner, uint256 keyNonce) internal virtual override {
        (uint192 key, ) = _unpack(keyNonce);
        if (key == 0) {
            super._useCheckedNonce(owner, keyNonce);
        } else {
            uint256 current = _useNonce(owner, key);
            if (keyNonce != current) revert InvalidAccountNonce(owner, current);
        }
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     *
     * This version takes the key and the nonce as two different parameters.
     */
    function _useCheckedNonce(address owner, uint192 key, uint64 nonce) internal virtual {
        _useCheckedNonce(owner, _pack(key, nonce));
    }

    /// @dev Pack key and nonce into a keyNonce
    function _pack(uint192 key, uint64 nonce) private pure returns (uint256) {
        return (uint256(key) << 64) | nonce;
    }

    /// @dev Unpack a keyNonce into its key and nonce components
    function _unpack(uint256 keyNonce) private pure returns (uint192 key, uint64 nonce) {
        return (uint192(keyNonce >> 64), uint64(keyNonce));
    }
}
