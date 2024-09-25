// contracts/MyAccountECDSATypedSigner.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccountBase, PackedUserOperation} from "../../../account/AccountBase.sol";
import {ERC1271TypedSigner} from "../../../account/ERC1271TypedSigner.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {ERC4337Utils} from "../../../account/utils/ERC4337Utils.sol";

contract MyAccountECDSATypedSigner is AccountBase, ERC1271TypedSigner {
    address private immutable _signer;

    constructor(address signer_, string memory name, string memory version) ERC1271TypedSigner(name, version) {
        _signer = signer_;
    }

    /// @inheritdoc AccountBase
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (address, uint256) {
        return
            _isValidSignature(userOpHash, userOp.signature) // Depend on an EIP-712 nested signature for readability
                ? (_signer, ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }

    /// @inheritdoc ERC1271TypedSigner
    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return _signer == recovered && err == ECDSA.RecoverError.NoError;
    }
}
