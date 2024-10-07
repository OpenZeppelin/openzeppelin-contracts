// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../../utils/cryptography/RSA.sol";
import {SignatureValidator} from "./SignatureValidator.sol";

abstract contract RSAValidator is SignatureValidator {
    mapping(address sender => bytes) private _associatedE;
    mapping(address sender => bytes) private _associatedN;

    event RSASignerAssociated(address indexed account, bytes e, bytes n);
    event RSASignerDisassociated(address indexed account);

    function signer(address account) public view virtual returns (bytes memory e, bytes memory n) {
        return (_associatedE[account], _associatedN[account]);
    }

    function onInstall(bytes calldata data) public virtual {
        (bytes memory e, bytes memory n) = abi.decode(data, (bytes, bytes));
        _onInstall(msg.sender, e, n);
    }

    function onUninstall(bytes calldata) public virtual {
        _onUninstall(msg.sender);
    }

    function _onInstall(address account, bytes memory e, bytes memory n) internal virtual {
        _associatedE[account] = e;
        _associatedN[account] = n;
        emit RSASignerAssociated(account, e, n);
    }

    function _onUninstall(address account) internal virtual {
        delete _associatedE[account];
        delete _associatedN[account];
        emit RSASignerDisassociated(account);
    }

    function _validateSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer(sender);
        return RSA.pkcs1(envelopeHash, signature, e, n);
    }
}
