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
    ) internal virtual override returns (bool, address, uint48 validAfter, uint48 validUntil) {
        uint256 arrayLength = _getUint256(signatures, _getUint256(signatures, 0));

        if (arrayLength < requiredSignatures()) {
            return (false, address(0), 0, 0);
        }

        address lastSigner = address(0);

        for (uint256 i = 0; i < arrayLength; ++i) {
            (bool sigValid, address sigSigner, uint48 sigValidAfter, uint48 sigValidUntil) = super._processSignature(
                userOpHash,
                _getBytesArrayElement(signatures, i)
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

    function _getUint256(bytes calldata data, uint256 pos) private pure returns (uint256 result) {
        assembly ("memory-safe") {
            result := calldataload(add(data.offset, pos))
        }
    }

    function _getBytesArrayElement(bytes calldata data, uint256 i) private pure returns (bytes calldata result) {
        assembly ("memory-safe") {
            let begin := add(add(data.offset, calldataload(data.offset)), 0x20) // data.offset + internal offset + skip length
            let offset := add(begin, calldataload(add(begin, mul(i, 0x20)))) // begin + element offset (stored at begin + i * 20)
            result.length := calldataload(offset) // length
            result.offset := add(offset, 0x20) // location
        }
    }
}
