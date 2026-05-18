// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "../ERC20.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {IERC3009, IERC3009Cancel} from "../../../interfaces/draft-IERC3009.sol";
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
 */
abstract contract ERC3009 is ERC20, EIP712, IERC3009, IERC3009Cancel {
    /// @dev The signature is invalid
    error ERC3009InvalidSignature();

    /// @dev The authorization is not valid at the given time
    error ERC3009InvalidAuthorizationTime(uint256 validAfter, uint256 validBefore);

    bytes32 internal constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
        keccak256(
            "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    bytes32 internal constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH =
        keccak256(
            "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
        );
    bytes32 internal constant CANCEL_AUTHORIZATION_TYPEHASH =
        keccak256("CancelAuthorization(address authorizer,bytes32 nonce)");

    mapping(address account => mapping(bytes32 nonce => bool used)) private _usedNonces;

    /// @inheritdoc IERC3009
    function authorizationState(address authorizer, bytes32 nonce) public view virtual returns (bool) {
        return _usedNonces[authorizer][nonce];
    }

    /// @inheritdoc IERC3009
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
        require(from == ECDSA.recover(hash, v, r, s), ERC3009InvalidSignature());
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce);
    }

    /// @inheritdoc IERC3009
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
        require(from == ECDSA.recover(hash, v, r, s), ERC3009InvalidSignature());
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce);
    }

    /// @inheritdoc IERC3009Cancel
    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) public virtual {
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        require(authorizer == ECDSA.recover(hash, v, r, s), ERC3009InvalidSignature());
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
            _clock() > validAfter && _clock() < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        _consumeNonce(from, nonce);
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
            _clock() > validAfter && _clock() < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        _consumeNonce(from, nonce);
        emit AuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    /// @dev Internal version of {cancelAuthorization} that accepts a bytes signature.
    function _cancelAuthorization(address authorizer, bytes32 nonce) internal virtual {
        _consumeNonce(authorizer, nonce);
        emit AuthorizationCanceled(authorizer, nonce);
    }

    function _clock() internal view virtual returns (uint48) {
        return Time.timestamp();
    }

    function _consumeNonce(address authorizer, bytes32 nonce) internal virtual {
        require(!_usedNonces[authorizer][nonce], "ERC3009: authorization is already used or canceled");
        _usedNonces[authorizer][nonce] = true;
    }
}
