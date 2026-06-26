// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC3009} from "./draft-ERC3009.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {NoncesKeyed} from "../../../utils/NoncesKeyed.sol";

/**
 * @dev Variant of {ERC-3009} that uses keyed sequential nonces as defined in {NoncesKeyed}.
 *
 * NOTE: This extension uses keyed sequential nonces following the
 * https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337 semi-abstracted nonce system].
 * The {bytes32} nonce field is interpreted as a 192-bit key packed with a 64-bit sequence. Nonces with
 * different keys are independent and can be submitted in parallel without ordering constraints, while nonces
 * sharing the same key must be used sequentially. This is unlike {ERC20Permit} which uses a single global
 * sequential nonce.
 */
abstract contract ERC20TransferAuthorization is ERC3009, NoncesKeyed {
    /**
     * @dev See {IERC3009-authorizationState}.
     *
     * NOTE: Returning `false` does not guarantee that the authorization is currently executable.
     * With keyed sequential nonces, a nonce may be blocked by a predecessor in the same key's sequence
     * that has not yet been consumed.
     */
    function authorizationState(address authorizer, bytes32 nonce) public view virtual override returns (bool) {
        // Truncating `nonces()` to uint64 is safe: reaching 2^64 sequential uses for a single key is infeasible.
        return uint64(nonces(authorizer, uint192(uint256(nonce) >> 64))) > uint64(uint256(nonce));
    }

    /// @dev Same as {transferWithAuthorization} but with a bytes signature.
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) public virtual {
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(TRANSFER_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        require(SignatureChecker.isValidSignatureNow(from, hash, signature), ERC3009InvalidSignature());
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce);
    }

    /// @dev Same as {receiveWithAuthorization} but with a bytes signature.
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) public virtual {
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(RECEIVE_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        require(SignatureChecker.isValidSignatureNow(from, hash, signature), ERC3009InvalidSignature());
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce);
    }

    /**
     * @dev Same as {cancelAuthorization} but with a bytes signature.
     *
     * NOTE: Due to the keyed sequential nonce model, only the next nonce in a given key's sequence
     * can be cancelled. It is not possible to directly cancel a future nonce whose predecessors in the
     * same key have not yet been consumed or cancelled. To invalidate a future authorization, all
     * preceding nonces in the same key must first be consumed or cancelled in order.
     */
    function cancelAuthorization(address authorizer, bytes32 nonce, bytes memory signature) public virtual {
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        require(SignatureChecker.isValidSignatureNow(authorizer, hash, signature), ERC3009InvalidSignature());
        _cancelAuthorization(authorizer, nonce);
    }

    /**
     * @dev Override the internal nonce consumption logic to use the keyed sequential nonces from {NoncesKeyed}.
     *
     * NOTE: This override does not call `super._consumeNonce`, so any sibling override added by another extension
     * is skipped under C3 linearization. Integrators combining this contract with extensions that introduce
     * additional side effects through `_consumeNonce` must reintroduce those side effects themselves.
     */
    function _consumeNonce(address authorizer, bytes32 nonce) internal virtual override {
        _useCheckedNonce(authorizer, uint256(nonce));
    }
}
