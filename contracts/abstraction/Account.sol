// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint} from "../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../utils/cryptography/MessageHashUtils.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";

abstract contract Account is IAccount {
    using SafeCast for bool;

    error AccountEntryPointRestricted();
    error AccountUserRestricted();
    error AccountInvalidBatchLength();

    // Modifiers
    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
        _;
    }

    modifier onlyAuthorizedOrSelf() {
        if (msg.sender != address(this) && !_isAuthorized(msg.sender)) {
            revert AccountUserRestricted();
        }
        _;
    }

    // Virtual pure (not implemented) hooks
    function entryPoint() public view virtual returns (IEntryPoint);

    function _isAuthorized(address) internal view virtual returns (bool);

    // Public interface
    function getNonce() public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), 0);
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override onlyEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData) {
        return
            (_isAuthorized(userOp.sender) &&
                SignatureChecker.isValidSignatureNow(
                    userOp.sender,
                    MessageHashUtils.toEthSignedMessageHash(userOpHash),
                    userOp.signature
                )).toUint();
    }

    function _validateNonce(uint256 nonce) internal view virtual {
        // TODO ?
    }

    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success;
            //ignore failure (its EntryPoint's job to verify, not account.)
        }
    }
}
