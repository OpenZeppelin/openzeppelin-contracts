// contracts/MyModularAccountECDSATypedSigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {AccountERC7579} from "../../../account/AccountERC7579.sol";
import {ERC1271TypedSigner} from "../../../account/ERC1271TypedSigner.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {ERC4337Utils, PackedUserOperation} from "../../../account/utils/ERC4337Utils.sol";

contract MyModularAccountECDSATypedSigner is AccountERC7579, ERC1271TypedSigner {
    address private immutable _signer;

    constructor(address signer_, string memory name, string memory version) ERC1271TypedSigner(name, version) {
        _signer = signer_;
    }

    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) public view override(AccountERC7579, ERC1271TypedSigner) returns (bytes4) {
        // Prefer signer and fallback to ERC7579 validator
        return
            ERC1271TypedSigner.isValidSignature(hash, signature) == IERC1271.isValidSignature.selector
                ? IERC1271.isValidSignature.selector
                : AccountERC7579.isValidSignature(hash, signature);
    }

    /// @inheritdoc AccountERC7579
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (address, uint256) {
        // Prefer signer and fallback to ERC7579 validator
        if (_validateSignature(userOpHash, userOp.signature)) return (_signer, ERC4337Utils.SIG_VALIDATION_SUCCESS);
        return super._validateUserOp(userOp, userOpHash);
    }

    /// @inheritdoc ERC1271TypedSigner
    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return _signer == recovered && err == ECDSA.RecoverError.NoError;
    }
}
