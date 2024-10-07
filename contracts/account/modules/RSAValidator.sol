// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../../utils/cryptography/RSA.sol";
import {SignatureValidator} from "./SignatureValidator.sol";

/**
 * @dev {SignatureValidator} for {RSA} signatures.
 */
abstract contract RSAValidator is SignatureValidator {
    mapping(address sender => bytes) private _associatedE;
    mapping(address sender => bytes) private _associatedN;

    /**
     * @dev Emitted when an account is associated with an RSA public key.
     */
    event RSASignerAssociated(address indexed account, bytes e, bytes n);

    /**
     * @dev Emitted when an account is disassociated from an RSA public key.
     */
    event RSASignerDisassociated(address indexed account);

    /**
     * @dev Return the account's signer RSA public key for the given account.
     */
    function signer(address account) public view virtual returns (bytes memory e, bytes memory n) {
        return (_associatedE[account], _associatedN[account]);
    }

    /**
     * @dev Associates an account with an RSA public key.
     *
     * The `data` is expected to be an `abi.encode(e, n)` where `e` and `n` are
     * the RSA public key components.
     */
    function onInstall(bytes calldata data) public virtual {
        (bytes memory e, bytes memory n) = abi.decode(data, (bytes, bytes));
        _onInstall(msg.sender, e, n);
    }

    /**
     * @dev Disassociates an account from an RSA public key.
     */
    function onUninstall(bytes calldata) public virtual {
        _onUninstall(msg.sender);
    }

    /**
     * @dev Internal version of {onInstall} without access control.
     */
    function _onInstall(address account, bytes memory e, bytes memory n) internal virtual {
        _associatedE[account] = e;
        _associatedN[account] = n;
        emit RSASignerAssociated(account, e, n);
    }

    /**
     * @dev Internal version of {onUninstall} without access control.
     */
    function _onUninstall(address account) internal virtual {
        delete _associatedE[account];
        delete _associatedN[account];
        emit RSASignerDisassociated(account);
    }

    /**
     * @dev Validate the RSA signature with the account's associated public key.
     */
    function _validateSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer(sender);
        return RSA.pkcs1(envelopeHash, signature, e, n);
    }
}
