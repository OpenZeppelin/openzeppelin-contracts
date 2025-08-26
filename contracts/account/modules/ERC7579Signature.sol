// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {IERC7579Module} from "../../interfaces/draft-IERC7579.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC7579Validator} from "./ERC7579Validator.sol";

/**
 * @dev Implementation of {ERC7579Validator} module using ERC-7913 signature verification.
 *
 * This validator allows ERC-7579 accounts to integrate with address-less cryptographic keys
 * and account signatures through the ERC-7913 signature verification system. Each account
 * can store its own ERC-7913 formatted signer (a concatenation of a verifier address and a
 * key: `verifier || key`).
 *
 * This enables accounts to use signature schemes without requiring each key to have its own
 * Ethereum address.A smart account with this module installed can keep an emergency key as a
 * backup.
 */
contract ERC7579Signature is ERC7579Validator {
    mapping(address account => bytes signer) private _signers;

    /// @dev Emitted when the signer is set.
    event ERC7579SignatureSignerSet(address indexed account, bytes signer);

    /// @dev Thrown when the signer length is less than 20 bytes.
    error ERC7579SignatureInvalidSignerLength();

    /// @dev Return the ERC-7913 signer (i.e. `verifier || key`).
    function signer(address account) public view virtual returns (bytes memory) {
        return _signers[account];
    }

    /**
     * @dev See {IERC7579Module-onInstall}.
     *
     * NOTE: An account can only call onInstall once. If called directly by the account,
     * the signer will be set to the provided data. Future installations will behave as a no-op.
     */
    function onInstall(bytes calldata data) public virtual {
        if (signer(msg.sender).length == 0) {
            setSigner(data);
        }
    }

    /**
     * @dev See {IERC7579Module-onUninstall}.
     *
     * WARNING: The signer's key will be removed if the account calls this function, potentially
     * making the account unusable. As an account operator, make sure to uninstall to a predefined path
     * in your account that properly handles side effects of uninstallation.  See {AccountERC7579-uninstallModule}.
     */
    function onUninstall(bytes calldata) public virtual {
        _setSigner(msg.sender, "");
    }

    /// @dev Sets the ERC-7913 signer (i.e. `verifier || key`) for the calling account.
    function setSigner(bytes memory signer_) public virtual {
        require(signer_.length >= 20, ERC7579SignatureInvalidSignerLength());
        _setSigner(msg.sender, signer_);
    }

    /// @dev Internal version of {setSigner} that takes an `account` as argument without validating `signer_`.
    function _setSigner(address account, bytes memory signer_) internal virtual {
        _signers[account] = signer_;
        emit ERC7579SignatureSignerSet(account, signer_);
    }

    /**
     * @dev See {ERC7579Validator-_rawERC7579Validation}.
     *
     * Validates a `signature` using ERC-7913 verification.
     *
     * This base implementation ignores the `sender` parameter and validates using
     * the account's stored signer. Derived contracts can override this to implement
     * custom validation logic based on the sender.
     */
    function _rawERC7579Validation(
        address account,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        return SignatureChecker.isValidSignatureNow(signer(account), hash, signature);
    }
}
