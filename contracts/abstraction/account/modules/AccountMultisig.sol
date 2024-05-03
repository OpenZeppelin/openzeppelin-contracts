// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {Math} from "./../../../utils/math/Math.sol";
import {ERC4337Utils} from "./../../utils/ERC4337Utils.sol";
import {Account} from "../Account.sol";

abstract contract AccountMultisig is Account {
    function requiredSignatures(PackedUserOperation calldata userOp) public view virtual returns (uint256);

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes[] memory signatures = abi.decode(userOp.signature, (bytes[]));

        if (signatures.length < requiredSignatures(userOp)) {
            return ERC4337Utils.SIG_VALIDATION_FAILED;
        }

        address lastSigner = address(0);
        uint48 globalValidAfter = 0;
        uint48 globalValidUntil = 0;

        for (uint256 i = 0; i < signatures.length; ++i) {
            (address signer, uint48 validAfter, uint48 validUntil) = _processSignature(signatures[i], userOpHash);
            if (_isAuthorized(signer) && signer > lastSigner) {
                lastSigner = signer;
                globalValidAfter = uint48(Math.ternary(validUntil < globalValidUntil, globalValidUntil, validAfter));
                globalValidUntil = uint48(
                    Math.ternary(validUntil > globalValidUntil || validUntil == 0, globalValidUntil, validUntil)
                );
            } else {
                return ERC4337Utils.SIG_VALIDATION_FAILED;
            }
        }
        return ERC4337Utils.packValidationData(true, globalValidAfter, globalValidUntil);
    }
}
