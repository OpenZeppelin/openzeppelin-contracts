// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {P256} from "../../utils/cryptography/P256.sol";
import {SignatureValidator} from "./SignatureValidator.sol";

/**
 * @dev {SignatureValidator} for {P256} signatures.
 */
abstract contract P256Validator is SignatureValidator {
    mapping(address sender => bytes32) private _associatedQx;
    mapping(address sender => bytes32) private _associatedQy;

    /**
     * @dev Emitted when an account is associated with a P256 public key.
     */
    event P256SignerAssociated(address indexed account, bytes32 qx, bytes32 qy);

    /**
     * @dev Emitted when an account is disassociated from a P256 public key.
     */
    event P256SignerDisassociated(address indexed account);

    /**
     * @dev Return the account's signer P256 public key for the given account.
     */
    function signer(address account) public view virtual returns (bytes32, bytes32) {
        return (_associatedQx[account], _associatedQy[account]);
    }

    /**
     * @dev Associates an account with a P256 public key.
     *
     * The `data` is expected to be an `abi.encode(qx, qy)` where `qx` and `qy` are
     * the P256 public key components.
     */
    function onInstall(bytes calldata data) public virtual {
        (bytes32 qx, bytes32 qy) = abi.decode(data, (bytes32, bytes32));
        _onInstall(msg.sender, qx, qy);
    }

    /**
     * @dev Disassociates an account from a P256 public key.
     */
    function onUninstall(bytes calldata) public virtual {
        _onUninstall(msg.sender);
    }

    /**
     * @dev Internal version of {onInstall} without access control.
     */
    function _onInstall(address account, bytes32 qx, bytes32 qy) internal virtual {
        _associatedQx[account] = qx;
        _associatedQy[account] = qy;
        emit P256SignerAssociated(account, qx, qy);
    }

    /**
     * @dev Internal version of {onUninstall} without access control.
     */
    function _onUninstall(address account) internal virtual {
        delete _associatedQx[account];
        delete _associatedQy[account];
        emit P256SignerDisassociated(account);
    }

    /**
     * @dev Validate the P256 signature with the account's associated public key.
     */
    function _validateSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        if (signature.length < 0x40) return false;

        // parse signature
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);

        // fetch and decode immutable public key for the clone
        (bytes32 qx, bytes32 qy) = signer(sender);
        return P256.verify(envelopeHash, r, s, qx, qy);
    }
}
