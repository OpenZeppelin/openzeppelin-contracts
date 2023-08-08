// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Context} from "./Context.sol";

/**
 * @dev Provides tracking nonces for addresses. Nonces will only increment.
 */
abstract contract Nonces is Context {
    bytes32 internal constant DEFAULT_TYPEHASH = 0;

    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidAccountNonce(address account, uint256 currentNonce);

    error InvalidFastForward(address account, uint256 currentNonce);

    // signer → typehash → beneficiary (track) → nonce
    mapping(address => mapping(bytes32 => mapping(bytes32 => uint256))) private _nonces;

    /**
     * @dev Returns the next unused nonce for an address.
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return operationIds(DEFAULT_TYPEHASH, owner, 0);
    }

    /**
     * @dev Returns the next unused nonce for an address and a typehash.
     */
    function operationNonces(bytes32 typehash, address signer) public view virtual returns (uint256) {
        return operationIds(typehash, signer, 0);
    }

    /**
     * @dev Returns the next unused nonce for an address, a typehash and a beneficiary.
     */
    function operationIds(bytes32 typehash, address signer, bytes32 beneficiary) public view virtual returns (uint256) {
        return _nonces[signer][typehash][beneficiary];
    }

    /**
     * @dev Invalidate a chunk of nonces, up to `last` for the calling account and the specified typehash. After this
     * call is executed, the next unused nonce for that account and that typehash will be `last + 1`.
     *
     * Requirements:
     * - last must be at least the current nonce.
     * - last must not invalidate more than 5000 nonces at once.
     */
    function useOperationNonce(bytes32 typehash, uint256 last) public virtual {
        useOperationIds(typehash, 0, last);
    }

    /**
     * @dev Invalidate a chunk of nonces, up to `last` for the calling account and the specified typehash and
     * beneficiary. After this call is executed, the next unused nonce for that account, that typehash and that
     * beneficiary will be `last + 1`.
     *
     * Requirements:
     * - last must be at least the current nonce.
     * - last must not invalidate more than 5000 nonces at once.
     */
    function useOperationIds(bytes32 typehash, bytes32 beneficiary, uint256 last) public virtual {
        address caller = _msgSender();

        uint256 current = _nonces[caller][typehash][beneficiary];
        if (last < current || last > current + 5000) {
            revert InvalidFastForward(caller, current);
        }
        _nonces[caller][typehash][beneficiary] = last + 1;
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner) internal virtual returns (uint256) {
        return _useNonce(DEFAULT_TYPEHASH, owner, 0);
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     */
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual returns (uint256) {
        return _useCheckedNonce(DEFAULT_TYPEHASH, owner, 0, nonce);
    }

    /**
     * @dev Consumes a nonce for a given typehash, signer and beneficiary.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(bytes32 typehash, address signer, bytes32 beneficiary) internal virtual returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return _nonces[signer][typehash][beneficiary]++;
        }
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     */
    function _useCheckedNonce(bytes32 typehash, address signer, bytes32 beneficiary, uint256 nonce) internal virtual returns (uint256) {
        uint256 current = _useNonce(typehash, signer, beneficiary);
        if (nonce != current) {
            revert InvalidAccountNonce(signer, current);
        }
        return current;
    }
}
