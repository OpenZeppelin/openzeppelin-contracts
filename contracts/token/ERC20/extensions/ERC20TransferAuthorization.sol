// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";
import {IERC3009, IERC3009Cancel} from "../../../interfaces/draft-IERC3009.sol";

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
 * NOTE: This extension uses non-sequential nonces to allow for flexible transaction ordering
 * and parallel transaction submission, unlike {ERC20Permit} which uses sequential nonces.
 */
abstract contract ERC20TransferAuthorization is ERC20, EIP712, IERC3009, IERC3009Cancel {
    /// @dev The signature is invalid
    error ERC3009InvalidSignature();

    /// @dev The authorization is already used or canceled
    error ERC3009ConsumedAuthorization(address authorizer, bytes32 nonce);

    /// @dev The authorization is not valid at the given time
    error ERC3009InvalidAuthorizationTime(uint256 validAfter, uint256 validBefore);

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

    mapping(address => mapping(bytes32 => bool)) private _consumed;

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     *
     * It's a good idea to use the same `name` that is defined as the ERC-20 token name.
     */
    constructor(string memory name) EIP712(name, "1") {}

    /**
     * @dev Returns the domain separator used in the encoding of the signature for
     * {transferWithAuthorization} and {receiveWithAuthorization}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @inheritdoc IERC3009
    function authorizationState(address authorizer, bytes32 nonce) public view virtual returns (bool) {
        return _consumed[authorizer][nonce];
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
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, abi.encodePacked(r, s, v));
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
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, signature);
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
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce, abi.encodePacked(r, s, v));
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
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce, signature);
    }

    /// @inheritdoc IERC3009Cancel
    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) public virtual {
        _cancelAuthorization(authorizer, nonce, abi.encodePacked(r, s, v));
    }

    /// @dev Same as {cancelAuthorization} but with a bytes signature.
    function cancelAuthorization(address authorizer, bytes32 nonce, bytes memory signature) public virtual {
        _cancelAuthorization(authorizer, nonce, signature);
    }

    /// @dev Internal version of {transferWithAuthorization} that accepts a bytes signature.
    function _transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes memory signature
    ) internal virtual {
        require(
            block.timestamp > validAfter && block.timestamp < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        require(!authorizationState(from, nonce), ERC3009ConsumedAuthorization(from, nonce));
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(TRANSFER_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        require(SignatureChecker.isValidSignatureNow(from, hash, signature), ERC3009InvalidSignature());

        _consumed[from][nonce] = true;
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
        bytes32 nonce,
        bytes memory signature
    ) internal virtual {
        require(to == _msgSender(), ERC20InvalidReceiver(to));
        require(
            block.timestamp > validAfter && block.timestamp < validBefore,
            ERC3009InvalidAuthorizationTime(validAfter, validBefore)
        );
        require(!authorizationState(from, nonce), ERC3009ConsumedAuthorization(from, nonce));
        bytes32 hash = _hashTypedDataV4(
            keccak256(abi.encode(RECEIVE_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce))
        );
        require(SignatureChecker.isValidSignatureNow(from, hash, signature), ERC3009InvalidSignature());

        _consumed[from][nonce] = true;
        emit AuthorizationUsed(from, nonce);
        _transfer(from, to, value);
    }

    /// @dev Internal version of {cancelAuthorization} that accepts a bytes signature.
    function _cancelAuthorization(address authorizer, bytes32 nonce, bytes memory signature) internal virtual {
        require(!authorizationState(authorizer, nonce), ERC3009ConsumedAuthorization(authorizer, nonce));
        bytes32 hash = _hashTypedDataV4(keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)));
        require(SignatureChecker.isValidSignatureNow(authorizer, hash, signature), ERC3009InvalidSignature());

        _consumed[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }
}
