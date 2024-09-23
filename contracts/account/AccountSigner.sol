// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {EIP712ReadableSigner} from "./signers/EIP712ReadableSigner.sol";
import {AccountBase} from "./AccountBase.sol";
import {ShortStrings} from "../utils/ShortStrings.sol";

abstract contract AccountSigner is AccountBase, EIP712ReadableSigner {
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (address signer, uint256 validationData) {
        if (!_isValidSignature(userOpHash, userOp.signature)) return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        return (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS);
    }
}
