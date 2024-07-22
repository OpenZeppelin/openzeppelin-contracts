// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountValidateECDSA} from "./validation/AccountValidateECDSA.sol";
import {ERC4337Utils} from "../../utils/ERC4337Utils.sol";
import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";

abstract contract Account7702 is AccountValidateECDSA {
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        bytes calldata userOpSignature
    ) internal virtual override returns (address, uint256) {
        (address signer, uint256 validationData) = AccountValidateECDSA._validateUserOp(
            userOp,
            userOpHash,
            userOpSignature
        );

        return signer == address(this) ? (signer, validationData) : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}
