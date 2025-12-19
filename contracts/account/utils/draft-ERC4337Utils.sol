// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (account/utils/draft-ERC4337Utils.sol)

pragma solidity ^0.8.20;

import {IEntryPoint, PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {Math} from "../../utils/math/Math.sol";
import {Calldata} from "../../utils/Calldata.sol";
import {Packing} from "../../utils/Packing.sol";

/// @dev This is available on all entrypoint since v0.4.0, but is not formally part of the ERC.
interface IEntryPointExtra {
    function getUserOpHash(PackedUserOperation calldata userOp) external view returns (bytes32);
}

/**
 * @dev Library with common ERC-4337 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-4337[ERC-4337].
 */
library ERC4337Utils {
    using Packing for *;

    /// @dev Address of the entrypoint v0.7.0
    IEntryPoint internal constant ENTRYPOINT_V07 = IEntryPoint(0x0000000071727De22E5E9d8BAf0edAc6f37da032);

    /// @dev Address of the entrypoint v0.8.0
    IEntryPoint internal constant ENTRYPOINT_V08 = IEntryPoint(0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108);

    /// @dev Address of the entrypoint v0.9.0
    IEntryPoint internal constant ENTRYPOINT_V09 = IEntryPoint(0x433709009B8330FDa32311DF1C2AFA402eD8D009);

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) return this value on success.
    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) must return this value in case of signature failure, instead of revert.
    uint256 internal constant SIG_VALIDATION_FAILED = 1;

    /// @dev Magic value used in EntryPoint v0.9+ to detect the presence of a paymaster signature in `paymasterAndData`.
    bytes8 internal constant PAYMASTER_SIG_MAGIC = 0x22e325a297439656; // keccak256("PaymasterSignature")[:8]

    /// @dev Highest bit set to 1 in a 6-bytes field.
    uint48 internal constant BLOCK_RANGE_FLAG = 0x800000000000;

    /// @dev Mask for the lower 47 bits of a 6-bytes field (equivalent to uint48(~BLOCK_RANGE_FLAG)).
    uint48 internal constant BLOCK_RANGE_MASK = 0x7fffffffffff;

    /// @dev Validity range of the validation data.
    enum ValidationRange {
        TIMESTAMP,
        BLOCK
    }

    /**
     * @dev Parses the validation data into its components and the validity range. See {packValidationData}.
     * Strips away the highest bit flag from the `validAfter` and `validUntil` fields.
     */
    function parseValidationData(
        uint256 validationData
    ) internal pure returns (address aggregator, uint48 validAfter, uint48 validUntil, ValidationRange range) {
        validAfter = uint48(bytes32(validationData).extract_32_6(0));
        validUntil = uint48(bytes32(validationData).extract_32_6(6));
        aggregator = address(bytes32(validationData).extract_32_20(12));
        range = ((validAfter & validUntil & BLOCK_RANGE_FLAG) == 0) ? ValidationRange.TIMESTAMP : ValidationRange.BLOCK;

        validAfter &= BLOCK_RANGE_MASK;
        validUntil &= BLOCK_RANGE_MASK;

        if (validUntil == 0) validUntil = BLOCK_RANGE_MASK;
    }

    /// @dev Packs the validation data into a single uint256. See {parseValidationData}.
    function packValidationData(
        address aggregator,
        uint48 validAfter,
        uint48 validUntil
    ) internal pure returns (uint256) {
        return
            packValidationData(
                aggregator,
                validAfter,
                validUntil,
                (validAfter & validUntil & BLOCK_RANGE_FLAG) == 0 ? ValidationRange.TIMESTAMP : ValidationRange.BLOCK
            );
    }

    /**
     * @dev Variant of {packValidationData} that forces which validity range to use. This overwrites the presence of
     * flags in `validAfter` and `validUntil`).
     */
    function packValidationData(
        address aggregator,
        uint48 validAfter,
        uint48 validUntil,
        ValidationRange range
    ) internal pure returns (uint256) {
        if (range == ValidationRange.TIMESTAMP) {
            validAfter &= BLOCK_RANGE_MASK;
            validUntil &= BLOCK_RANGE_MASK;
        } else if (range == ValidationRange.BLOCK) {
            validAfter |= BLOCK_RANGE_FLAG;
            validUntil |= BLOCK_RANGE_FLAG;
        }
        return uint256(bytes6(validAfter).pack_6_6(bytes6(validUntil)).pack_12_20(bytes20(aggregator)));
    }

    /// @dev Variant of {packValidationData} that uses a boolean success flag instead of an aggregator address.
    function packValidationData(bool sigSuccess, uint48 validAfter, uint48 validUntil) internal pure returns (uint256) {
        return
            packValidationData(
                address(uint160(Math.ternary(sigSuccess, SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED))),
                validAfter,
                validUntil
            );
    }

    /**
     * @dev Variant of {packValidationData} that uses a boolean success flag instead of an aggregator address and that
     * forces which validity range to use. This overwrites the presence of flags in `validAfter` and `validUntil`).
     */
    function packValidationData(
        bool sigSuccess,
        uint48 validAfter,
        uint48 validUntil,
        ValidationRange range
    ) internal pure returns (uint256) {
        return
            packValidationData(
                address(uint160(Math.ternary(sigSuccess, SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED))),
                validAfter,
                validUntil,
                range
            );
    }

    /**
     * @dev Combines two validation data into a single one.
     *
     * The `aggregator` is set to {SIG_VALIDATION_SUCCESS} if both are successful, while
     * the `validAfter` is the maximum and the `validUntil` is the minimum of both.
     *
     * NOTE: Returns `SIG_VALIDATION_FAILED` if the validation ranges differ.
     */
    function combineValidationData(uint256 validationData1, uint256 validationData2) internal pure returns (uint256) {
        (address aggregator1, uint48 validAfter1, uint48 validUntil1, ValidationRange range1) = parseValidationData(
            validationData1
        );
        (address aggregator2, uint48 validAfter2, uint48 validUntil2, ValidationRange range2) = parseValidationData(
            validationData2
        );

        if (range1 == range2) {
            bool success = aggregator1 == address(uint160(SIG_VALIDATION_SUCCESS)) &&
                aggregator2 == address(uint160(SIG_VALIDATION_SUCCESS));
            uint48 validAfter = uint48(Math.max(validAfter1, validAfter2));
            uint48 validUntil = uint48(Math.min(validUntil1, validUntil2));
            return packValidationData(success, validAfter, validUntil, range1);
        } else {
            return SIG_VALIDATION_FAILED;
        }
    }

    /// @dev Returns the aggregator of the `validationData` and whether it is out of time range.
    function getValidationData(uint256 validationData) internal view returns (address aggregator, bool outOfTimeRange) {
        (address aggregator_, uint48 validAfter, uint48 validUntil, ValidationRange range) = parseValidationData(
            validationData
        );
        uint256 current = Math.ternary(range == ValidationRange.TIMESTAMP, block.timestamp, block.number);
        return (aggregator_, current <= validAfter || validUntil < current);
    }

    /// @dev Get the hash of a user operation for a given entrypoint
    function hash(PackedUserOperation calldata self, address entrypoint) internal view returns (bytes32) {
        // NOTE: getUserOpHash is available since v0.4.0
        //
        // Prior to v0.8.0, this was easy to replicate for any entrypoint and chainId. Since v0.8.0 of the
        // entrypoint, this depends on the Entrypoint's domain separator, which cannot be hardcoded and is complex
        // to recompute. Domain separator could be fetch using the `getDomainSeparatorV4` getter, or recomputed from
        // the ERC-5267 getter, but both operation would require doing a view call to the entrypoint. Overall it feels
        // simpler and less error prone to get that functionality from the entrypoint directly.
        return IEntryPointExtra(entrypoint).getUserOpHash(self);
    }

    /// @dev Returns `factory` from the {PackedUserOperation}, or address(0) if the initCode is empty or not properly formatted.
    function factory(PackedUserOperation calldata self) internal pure returns (address) {
        return self.initCode.length < 20 ? address(0) : address(bytes20(self.initCode[0:20]));
    }

    /// @dev Returns `factoryData` from the {PackedUserOperation}, or empty bytes if the initCode is empty or not properly formatted.
    function factoryData(PackedUserOperation calldata self) internal pure returns (bytes calldata) {
        return self.initCode.length < 20 ? Calldata.emptyBytes() : self.initCode[20:];
    }

    /// @dev Returns `verificationGasLimit` from the {PackedUserOperation}.
    function verificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(0));
    }

    /// @dev Returns `callGasLimit` from the {PackedUserOperation}.
    function callGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(16));
    }

    /// @dev Returns the first section of `gasFees` from the {PackedUserOperation}.
    function maxPriorityFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(0));
    }

    /// @dev Returns the second section of `gasFees` from the {PackedUserOperation}.
    function maxFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(16));
    }

    /// @dev Returns the total gas price for the {PackedUserOperation} (ie. `maxFeePerGas` or `maxPriorityFeePerGas + basefee`).
    function gasPrice(PackedUserOperation calldata self) internal view returns (uint256) {
        unchecked {
            // Following values are "per gas"
            uint256 maxPriorityFee = maxPriorityFeePerGas(self);
            uint256 maxFee = maxFeePerGas(self);
            return Math.min(maxFee, maxPriorityFee + block.basefee);
        }
    }

    /// @dev Returns the first section of `paymasterAndData` from the {PackedUserOperation}.
    function paymaster(PackedUserOperation calldata self) internal pure returns (address) {
        return self.paymasterAndData.length < 52 ? address(0) : address(bytes20(self.paymasterAndData[0:20]));
    }

    /// @dev Returns the second section of `paymasterAndData` from the {PackedUserOperation}.
    function paymasterVerificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.paymasterAndData.length < 52 ? 0 : uint128(bytes16(self.paymasterAndData[20:36]));
    }

    /// @dev Returns the third section of `paymasterAndData` from the {PackedUserOperation}.
    function paymasterPostOpGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.paymasterAndData.length < 52 ? 0 : uint128(bytes16(self.paymasterAndData[36:52]));
    }

    /**
     * @dev Returns the fourth section of `paymasterAndData` from the {PackedUserOperation}.
     * If a paymaster signature is present, it is excluded from the returned data.
     */
    function paymasterData(PackedUserOperation calldata self) internal pure returns (bytes calldata) {
        bool hasSignature = self.paymasterAndData.length > 9 &&
            bytes8(self.paymasterAndData[self.paymasterAndData.length - 8:]) == PAYMASTER_SIG_MAGIC;
        uint256 suffixLength = hasSignature ? _paymasterSignatureSize(self) + 10 : 0;
        return
            self.paymasterAndData.length < 52 + suffixLength
                ? Calldata.emptyBytes()
                : self.paymasterAndData[52:self.paymasterAndData.length - suffixLength];
    }

    /**
     * @dev Returns the paymaster signature from `paymasterAndData` (EntryPoint v0.9+).
     * Returns empty bytes if no paymaster signature is present.
     */
    function paymasterSignature(PackedUserOperation calldata self) internal pure returns (bytes calldata) {
        if (
            self.paymasterAndData.length < 10 ||
            bytes8(self.paymasterAndData[self.paymasterAndData.length - 8:]) != PAYMASTER_SIG_MAGIC
        ) return Calldata.emptyBytes();

        uint256 sigSize = _paymasterSignatureSize(self);
        uint256 sigEnd = self.paymasterAndData.length - 10;
        return
            self.paymasterAndData.length < 62 + sigSize
                ? Calldata.emptyBytes()
                : self.paymasterAndData[sigEnd - sigSize:sigEnd];
    }

    /**
     * @dev Returns the size of the paymaster signature in `paymasterAndData` (EntryPoint v0.9+).
     * Does not check minimum length of `paymasterAndData`.
     */
    function _paymasterSignatureSize(PackedUserOperation calldata self) private pure returns (uint256) {
        return
            uint16(bytes2(self.paymasterAndData[self.paymasterAndData.length - 10:self.paymasterAndData.length - 8]));
    }
}
