// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {AccountERC7579} from "../../../account/draft-AccountERC7579.sol";
import {ERC1271TypedSigner} from "../../../utils/cryptography/ERC1271TypedSigner.sol";
import {ERC4337Utils, PackedUserOperation} from "../../../account/utils/ERC4337Utils.sol";
import {AccountECDSA} from "../../../account/AccountECDSA.sol";
import {AccountBase} from "../../../account/AccountBase.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";

contract MyModularAccountECDSATypedSigner is AccountECDSA, AccountERC7579 {
    constructor(
        address signer_,
        string memory name,
        string memory version
    ) AccountECDSA(signer_) EIP712(name, version) {}

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
    ) internal virtual override(AccountERC7579, AccountECDSA) returns (uint256) {
        // Prefer signer and fallback to ERC7579 validator
        if (_validateSignature(userOpHash, userOp.signature)) return ERC4337Utils.SIG_VALIDATION_SUCCESS;
        return super._validateUserOp(userOp, userOpHash);
    }

    function executeUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public override(AccountBase, AccountERC7579) {
        // Prefer modular execution
        AccountERC7579.executeUserOp(userOp, userOpHash);
    }
}
