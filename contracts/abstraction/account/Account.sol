// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint} from "../../interfaces/IERC4337.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "./../utils/ERC4337Utils.sol";

abstract contract Account is IAccount {
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

    modifier onlyAuthorizedOrEntryPoint() {
        if (msg.sender != address(entryPoint()) && !_isAuthorized(msg.sender)) {
            revert AccountUserRestricted();
        }
        _;
    }

    // Hooks
    function entryPoint() public view virtual returns (IEntryPoint);

    function _isAuthorized(address) internal virtual returns (bool);

    function _getSignerAndWindow(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (address, uint48, uint48);

    // Public interface
    function getNonce() public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), 0);
    }

    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
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

    // Internal mechanisms
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData) {
        (address signer, uint48 validAfter, uint48 validUntil) = _getSignerAndWindow(userOp, userOpHash);
        return ERC4337Utils.packValidationData(signer != address(0) && _isAuthorized(signer), validAfter, validUntil);
    }

    function _validateNonce(uint256 nonce) internal view virtual {}

    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success;
            //ignore failure (its EntryPoint's job to verify, not account.)
        }
    }
}
