// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {Math} from "./../../../utils/math/Math.sol";
import {ERC4337Utils} from "./../../utils/ERC4337Utils.sol";
import {Account} from "../Account.sol";

abstract contract AccountMultisig is Account {
    function requiredSignatures() public view virtual returns (uint256);

    function _processSignature(
        bytes32 userOpHash,
        bytes calldata signatures
    ) internal view virtual override returns (bool, address, uint48 validAfter, uint48 validUntil) {
        bytes[] calldata signatureArray = _decodeBytesArray(signatures);

        if (signatureArray.length < requiredSignatures()) {
            return (false, address(0), 0, 0);
        }

        address lastSigner = address(0);

        for (uint256 i = 0; i < signatureArray.length; ++i) {
            (bool sigValid, address sigSigner, uint48 sigValidAfter, uint48 sigValidUntil) = super._processSignature(
                userOpHash,
                signatureArray[i]
            );
            if (sigValid && sigSigner > lastSigner) {
                lastSigner = sigSigner;
                validAfter = uint48(Math.ternary(validAfter > sigValidAfter, validAfter, sigValidAfter));
                validUntil = uint48(
                    Math.ternary(validUntil < sigValidUntil || sigValidUntil == 0, validUntil, sigValidUntil)
                );
            } else {
                return (false, address(0), 0, 0);
            }
        }
        return (true, address(this), validAfter, validUntil);
    }

    function _decodeBytesArray(bytes calldata input) private pure returns (bytes[] calldata output) {
        assembly ("memory-safe") {
            let ptr := add(input.offset, calldataload(input.offset))
            output.offset := add(ptr, 32)
            output.length := calldataload(ptr)
        }
    }
}
