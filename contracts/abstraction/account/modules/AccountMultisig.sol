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
    ) internal virtual override returns (bool, address, uint48, uint48) {
        uint256 arrayLength = _getUint256(signatures, _getUint256(signatures, 0));

        if (arrayLength < requiredSignatures()) {
            return (false, address(0), 0, 0);
        }

        address lastSigner = address(0);
        uint48 globalValidAfter = 0;
        uint48 globalValidUntil = 0;

        for (uint256 i = 0; i < arrayLength; ++i) {
            bytes calldata signature = _getBytesArrayElement(signatures, i);
            (bool valid, address signer, uint48 validAfter, uint48 validUntil) = super._processSignature(
                userOpHash,
                signature
            );
            if (valid && signer > lastSigner) {
                lastSigner = signer;
                globalValidAfter = uint48(Math.ternary(validUntil < globalValidUntil, globalValidUntil, validAfter));
                globalValidUntil = uint48(
                    Math.ternary(validUntil > globalValidUntil || validUntil == 0, globalValidUntil, validUntil)
                );
            } else {
                return (false, address(0), 0, 0);
            }
        }
        return (true, address(this), globalValidAfter, globalValidUntil);
    }

    function _getUint256(bytes calldata data, uint256 pos) private pure returns (uint256 result) {
        assembly ("memory-safe") {
            result := calldataload(add(data.offset, pos))
        }
    }

    function _getBytesArrayElement(bytes calldata data, uint256 i) private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            let begin := add(calldataload(data.offset), 0x20)
            let offset := add(calldataload(add(add(data.offset, begin), mul(i, 0x20))), begin)
            result.length := calldataload(add(data.offset, offset))
            result.offset := add(add(data.offset, offset), 0x20)
        }
    }
}
