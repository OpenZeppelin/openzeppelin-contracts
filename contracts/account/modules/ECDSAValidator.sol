// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {SignatureValidator} from "./SignatureValidator.sol";

abstract contract ECDSAValidator is SignatureValidator {
    mapping(address sender => address signer) private _associatedSigners;

    event ECDSASignerAssociated(address indexed account, address indexed signer);
    event ECDSASignerDisassociated(address indexed account);

    function signer(address account) public view virtual returns (address) {
        return _associatedSigners[account];
    }

    function onInstall(bytes calldata data) public virtual {
        address signerAddr = abi.decode(data, (address));
        _onInstall(msg.sender, signerAddr);
    }

    function onUninstall(bytes calldata) public virtual {
        _onUninstall(msg.sender);
    }

    function _onInstall(address account, address signerAddr) internal virtual {
        _associatedSigners[account] = signerAddr;
        emit ECDSASignerAssociated(account, signerAddr);
    }

    function _onUninstall(address account) internal virtual {
        delete _associatedSigners[account];
        emit ECDSASignerDisassociated(account);
    }

    function _validateSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(envelopeHash, signature);
        return signer(sender) == recovered && err == ECDSA.RecoverError.NoError;
    }
}
