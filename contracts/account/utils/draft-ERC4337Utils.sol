// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (account/utils/draft-ERC4337Utils.sol)

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

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) return this value on success.
    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) must return this value in case of signature failure, instead of revert.
    uint256 internal constant SIG_VALIDATION_FAILED = 1;

    /// @dev Parses the validation data into its components. See {packValidationData}.
    function parseValidationData(
        uint256 validationData
    ) internal pure returns (address aggregator, uint48 validAfter, uint48 validUntil) {
        validAfter = uint48(bytes32(validationData).extract_32_6(0));
        validUntil = uint48(bytes32(validationData).extract_32_6(6));
        aggregator = address(bytes32(validationData).extract_32_20(12));
        if (validUntil == 0) validUntil = type(uint48).max;
    }

    /// @dev Packs the validation data into a single uint256. See {parseValidationData}.
    function packValidationData(
        address aggregator,
        uint48 validAfter,
        uint48 validUntil
    ) internal pure returns (uint256) {
        return uint256(bytes6(validAfter).pack_6_6(bytes6(validUntil)).pack_12_20(bytes20(aggregator)));
    }

    /// @dev Same as {packValidationData}, but with a boolean signature success flag.
    function packValidationData(bool sigSuccess, uint48 validAfter, uint48 validUntil) internal pure returns (uint256) {
        return
            packValidationData(
                address(uint160(Math.ternary(sigSuccess, SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED))),
                validAfter,
                validUntil
            );
    }

    /**
     * @dev Combines two validation data into a single one.
     *
     * The `aggregator` is set to {SIG_VALIDATION_SUCCESS} if both are successful, while
     * the `validAfter` is the maximum and the `validUntil` is the minimum of both.
     */
    function combineValidationData(uint256 validationData1, uint256 validationData2) internal pure returns (uint256) {
        (address aggregator1, uint48 validAfter1, uint48 validUntil1) = parseValidationData(validationData1);
        (address aggregator2, uint48 validAfter2, uint48 validUntil2) = parseValidationData(validationData2);

        bool success = aggregator1 == address(uint160(SIG_VALIDATION_SUCCESS)) &&
            aggregator2 == address(uint160(SIG_VALIDATION_SUCCESS));
        uint48 validAfter = uint48(Math.max(validAfter1, validAfter2));
        uint48 validUntil = uint48(Math.min(validUntil1, validUntil2));
        return packValidationData(success, validAfter, validUntil);
    }

    /// @dev Returns the aggregator of the `validationData` and whether it is out of time range.
    function getValidationData(uint256 validationData) internal view returns (address aggregator, bool outOfTimeRange) {
        (address aggregator_, uint48 validAfter, uint48 validUntil) = parseValidationData(validationData);
        return (aggregator_, block.timestamp < validAfter || validUntil < block.timestamp);
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

    /// @dev Returns the fourth section of `paymasterAndData` from the {PackedUserOperation}.
    function paymasterData(PackedUserOperation calldata self) internal pure returns (bytes calldata) {
        return self.paymasterAndData.length < 52 ? Calldata.emptyBytes() : self.paymasterAndData[52:];
    }
}
