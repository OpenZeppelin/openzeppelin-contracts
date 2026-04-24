// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "../ERC20.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {IERC3009, IERC3009Cancel} from "../../../interfaces/draft-IERC3009.sol";
import {NoncesKeyed} from "../../../utils/NoncesKeyed.sol";
import {IERC6372} from "../../../interfaces/IERC6372.sol";
import {Time} from "../../../utils/types/Time.sol";

/**
 * @dev Implementation of the ERC-3009 Transfer With Authorization extension allowing
 * transfers to be made via signatures, as defined in https://eips.ethereum.org/EIPS/eip-3009[ERC-3009].
 *
 * Adds the {transferWithAuthorization} and {receiveWithAuthorization} methods, which
 * can be used to change an account's ERC-20 balance by presenting a message signed
 * by the account. By not relying on {IERC20-approve} and {IERC20-transferFrom}, the
 * token holder account doesn't need to send a transaction, and thus is not required
 * to hold native currency (e.g. ETH) at all.
 *
 * NOTE: This extension uses keyed sequential nonces following the
 * https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337 semi-abstracted nonce system].
 * The {bytes32} nonce field is interpreted as a 192-bit key packed with a 64-bit sequence. Nonces with
 * different keys are independent and can be submitted in parallel without ordering constraints, while nonces
 * sharing the same key must be used sequentially. This is unlike {ERC20Permit} which uses a single global
 * sequential nonce.
 */
abstract contract ERC20TransferAuthorization is ERC20, EIP712, NoncesKeyed, IERC6372, IERC3009, IERC3009Cancel {
    /// @dev The signature is invalid
    error ERC3009InvalidSignature();

    /// @dev The authorization is not valid at the given time
    error ERC3009InvalidAuthorizationTime(uint256 validAfter, uint256 validBefore);

    /// @dev The clock was incorrectly modified.
    error ERC3009InconsistentClock();

    bytes32 private constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
        keccak256(
            "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    bytes32 private constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH =
        keccak256(
            "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    bytes32 private constant CANCEL_AUTHORIZATION_TYPEHASH =
        keccak256("CancelAuthorization(address authorizer,bytes32 nonce)");

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     *
     * It's a good idea to use the same `name` that is defined as the ERC-20 token name.
     */
    constructor(string memory name) EIP712(name, "1") {}

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
        // Check that the clock was not modified
        if (clock() != Time.timestamp()) {
            revert ERC3009InconsistentClock();
        }
        return "mode=timestamp";
    }

    /**
     * @dev See {IERC3009-authorizationState}.
     *
     * NOTE: Returning `false` does not guarantee that the authorization is currently executable.
     * With keyed sequential nonces, a nonce may be blocked by a predecessor in the same key's sequence
     * that has not yet been consumed.
     */
    function authorizationState(address authorizer, bytes32 nonce) public view virtual returns (bool) {
        return uint64(nonces(authorizer, uint192(uint256(nonce) >> 64))) > uint64(uint256(nonce));
    }

    /**
     * @dev See {IERC3009-transferWithAuthorization}.
     *
     * NOTE: A signed authorization will only succeed if its nonce is the next expected sequence
     * for the given key. Authorizations sharing a key must be submitted in order.
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(TRANSFER_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, v, r, s);
        require(err == ECDSA.RecoverError.NoError && recovered == from, ERC3009InvalidSignature());
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce);
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

    /**
     * @dev See {IERC3009-receiveWithAuthorization}.
     *
     * NOTE: A signed authorization will only succeed if its nonce is the next expected sequence
     * for the given key. Authorizations sharing a key must be submitted in order.
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(RECEIVE_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, v, r, s);
        require(err == ECDSA.RecoverError.NoError && recovered == from, ERC3009InvalidSignature());
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce);
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
     * @dev See {IERC3009Cancel-cancelAuthorization}.
     *
     * NOTE: Due to the keyed sequential nonce model, only the next nonce in a given key's sequence
     * can be cancelled. It is not possible to directly cancel a future nonce whose predecessors in the
     * same key have not yet been consumed or cancelled. To invalidate a future authorization, all
     * preceding nonces in the same key must first be consumed or cancelled in order.
     */
    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) public virtual {
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, v, r, s);
        require(err == ECDSA.RecoverError.NoError && recovered == authorizer, ERC3009InvalidSignature());
        _cancelAuthorization(authorizer, nonce);
    }

    /// @dev Same as {cancelAuthorization} but with a bytes signature.
    function cancelAuthorization(address authorizer, bytes32 nonce, bytes memory signature) public virtual {
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        require(SignatureChecker.isValidSignatureNow(authorizer, hash, signature), ERC3009InvalidSignature());
        _cancelAuthorization(authorizer, nonce);
    }

    /// @dev Internal version of {transferWithAuthorization} that accepts a bytes signature.
    function _transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce
    ) internal virtual {
        require(
            clock() > validAfter && clock() < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        _useCheckedNonce(from, uint256(nonce));
        emit AuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    /// @dev Internal version of {receiveWithAuthorization} that accepts a bytes signature.
    function _receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce
    ) internal virtual {
        require(to == _msgSender(), ERC20InvalidReceiver(to));
        require(
            clock() > validAfter && clock() < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        _useCheckedNonce(from, uint256(nonce));
        emit AuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    /// @dev Internal version of {cancelAuthorization} that accepts a bytes signature.
    function _cancelAuthorization(address authorizer, bytes32 nonce) internal virtual {
        _useCheckedNonce(authorizer, uint256(nonce));
        emit AuthorizationCanceled(authorizer, nonce);
    }
}
