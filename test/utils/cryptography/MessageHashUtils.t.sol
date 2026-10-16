// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MessageHashUtilsTest is Test {
    function testToDataWithIntendedValidatorHash(address validator, bytes memory data) external pure {
        assertEq(
            MessageHashUtils.toDataWithIntendedValidatorHash(validator, data),
            MessageHashUtils.toDataWithIntendedValidatorHash(_dirty(validator), data)
        );
    }

    function testToDataWithIntendedValidatorHash(address validator, bytes32 messageHash) external pure {
        assertEq(
            MessageHashUtils.toDataWithIntendedValidatorHash(validator, messageHash),
            MessageHashUtils.toDataWithIntendedValidatorHash(_dirty(validator), messageHash)
        );

        assertEq(
            MessageHashUtils.toDataWithIntendedValidatorHash(validator, messageHash),
            MessageHashUtils.toDataWithIntendedValidatorHash(validator, abi.encodePacked(messageHash))
        );
    }

    function testToDomainSeparator(
        bytes1 fields,
        bytes32 nameHash,
        bytes32 versionHash,
        uint256 chainId,
        address verifyingContract,
        bytes32 salt
    ) external pure {
        fields &= 0x1f; // bit 5 (extensions) is not supported, bits 6 and 7 are not defined

        assertEq(
            MessageHashUtils.toDomainSeparator(fields, nameHash, versionHash, chainId, verifyingContract, salt),
            MessageHashUtils.toDomainSeparator(fields, nameHash, versionHash, chainId, _dirty(verifyingContract), salt)
        );
    }

    function _dirty(address input) private pure returns (address output) {
        assembly ("memory-safe") {
            output := or(input, shl(160, not(0)))
        }
    }
}
