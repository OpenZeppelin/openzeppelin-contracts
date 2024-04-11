// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract NoncesWithKey {
    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidAccountNonce(address account, uint256 currentNonce);

    mapping(address => mapping(uint192 => uint64)) private _nonce;

    function getNonce(address owner, uint192 key) public view virtual returns (uint256) {
        return (uint256(key) << 64) | _nonce[owner][key];
    }

    function _useNonce(address owner, uint192 key) internal virtual returns (uint64) {
        // TODO: use unchecked here? Do we expect 2**64 nonce ever be used for a single owner?
        return _nonce[owner][key]++;
    }

    function _tryUseNonce(address owner, uint256 keyNonce) internal returns (bool) {
        return _tryUseNonce(owner, uint192(keyNonce >> 64), uint64(keyNonce));
    }

    function _tryUseNonce(address owner, uint192 key, uint64 nonce) internal virtual returns (bool) {
        return _useNonce(owner, key) == nonce;
    }

    function _useNonceOrRevert(address owner, uint256 keyNonce) internal {
        _useNonceOrRevert(owner, uint192(keyNonce >> 64), uint64(keyNonce));
    }

    function _useNonceOrRevert(address owner, uint192 key, uint64 nonce) internal virtual {
        uint256 current = _useNonce(owner, key);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
    }
}
