// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {ERC1271TypedSigner} from "../ERC1271TypedSigner.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";

abstract contract RSAValidator is ERC1271TypedSigner, IERC7579Validator {
    mapping(address => bytes) private _associatedE;
    mapping(address => bytes) private _associatedN;

    event RSASignerAssociated(address indexed account, bytes e, bytes n);
    event RSASignerDisassociated(address indexed account);

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

    function signer(address account) public view virtual returns (bytes memory e, bytes memory n) {
        return (_associatedE[account], _associatedN[account]);
    }

    function onInstall(bytes calldata data) public virtual {
        (address account, bytes memory e, bytes memory n) = abi.decode(data, (address, bytes, bytes));
        _onInstall(account, e, n);
    }

    function onUninstall(bytes calldata data) public virtual {
        address account = abi.decode(data, (address));
        _onUninstall(account);
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

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer(msg.sender);
        return RSA.pkcs1(hash, signature, e, n);
    }
}
