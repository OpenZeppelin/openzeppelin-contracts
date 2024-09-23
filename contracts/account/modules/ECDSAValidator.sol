// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {EIP712ReadableSigner} from "../EIP712ReadableSigner.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";

abstract contract ECDSAValidator is IERC7579Validator, EIP712ReadableSigner {
    mapping(address => address) private _associatedSigner;

    event ECDSASignerAssociated(address indexed account, address indexed signer);
    event ECDSASignerDisassociated(address indexed account);

    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    /// @inheritdoc IERC7579Validator
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public view virtual returns (uint256) {
        return
            _validateSignature(userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /// @inheritdoc IERC7579Validator
    function isValidSignatureWithSender(
        address,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return _validateSignature(hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    function signer(address account) public view virtual returns (address) {
        return _associatedSigner[account];
    }

    function onInstall(bytes calldata data) public virtual {
        (address account, address signerAddr) = abi.decode(data, (address, address));
        _onInstall(account, signerAddr);
    }

    function onUninstall(bytes calldata data) public virtual {
        address account = abi.decode(data, (address));
        _onUninstall(account);
    }

    function _onInstall(address account, address signerAddr) internal virtual {
        _associatedSigner[account] = signerAddr;
        emit ECDSASignerAssociated(account, signerAddr);
    }

    function _onUninstall(address account) internal virtual {
        delete _associatedSigner[account];
        emit ECDSASignerDisassociated(account);
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer(msg.sender) == recovered && err == ECDSA.RecoverError.NoError;
    }
}
