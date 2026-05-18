// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC3009} from "./draft-ERC3009.sol";
import {IERC6372} from "../../../interfaces/IERC6372.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {ERC6372Utils} from "../../../utils/ERC6372Utils.sol";
import {NoncesKeyed} from "../../../utils/NoncesKeyed.sol";
import {Time} from "../../../utils/types/Time.sol";

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
abstract contract ERC20TransferAuthorization is ERC3009, NoncesKeyed, IERC6372 {
    /**
     * @dev Clock used for validating authorization time windows ({transferWithAuthorization},
     * {receiveWithAuthorization}). Defaults to {Time-timestamp}. Can be overridden to implement
     * block-number based validation, in which case {CLOCK_MODE} should be overridden as well to match.
     */
    function clock() public view virtual returns (uint48) {
        return Time.timestamp();
    }

    /// @dev Machine-readable description of the clock as specified in ERC-6372.
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual returns (string memory) {
        return ERC6372Utils.timestampClockMode(clock);
    }

    /**
     * @dev See {IERC3009-authorizationState}.
     *
     * NOTE: Returning `false` does not guarantee that the authorization is currently executable.
     * With keyed sequential nonces, a nonce may be blocked by a predecessor in the same key's sequence
     * that has not yet been consumed.
     */
    function authorizationState(address authorizer, bytes32 nonce) public view virtual override returns (bool) {
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

    /// @dev Same as {cancelAuthorization} but with a bytes signature.
    function cancelAuthorization(address authorizer, bytes32 nonce, bytes memory signature) public virtual {
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        require(SignatureChecker.isValidSignatureNow(authorizer, hash, signature), ERC3009InvalidSignature());
        _cancelAuthorization(authorizer, nonce);
    }

    /// @dev Override the internal clock used by {ERC3009} to use the public {clock} function from {IERC6372}.
    function _clock() internal view virtual override returns (uint48) {
        return clock();
    }

    /// @dev Override the internal nonce consumption logic to use the keyed sequential nonces from {NoncesKeyed}.
    function _consumeNonce(address authorizer, bytes32 nonce) internal virtual override {
        _useCheckedNonce(authorizer, uint256(nonce));
    }
}
