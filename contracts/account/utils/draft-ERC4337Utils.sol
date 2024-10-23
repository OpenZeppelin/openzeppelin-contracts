// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint, PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {Math} from "../../utils/math/Math.sol";
import {Packing} from "../../utils/Packing.sol";

/**
 * @dev Library with common ERC-4337 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-4337[ERC-4337].
 */
library ERC4337Utils {
    using Packing for *;

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) return this value on success.
    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;

    /// @dev For simulation purposes, validateUserOp (and validatePaymasterUserOp) must return this value in case of signature failure, instead of revert.
    uint256 internal constant SIG_VALIDATION_FAILED = 1;

    /// @dev Parses the validation data into its components. See {packValidationData}.
    function parseValidationData(
        uint256 validationData
    ) internal pure returns (address aggregator, uint48 validAfter, uint48 validUntil) {
        validAfter = uint48(bytes32(validationData).extract_32_6(0x00));
        validUntil = uint48(bytes32(validationData).extract_32_6(0x06));
        aggregator = address(bytes32(validationData).extract_32_20(0x0c));
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

        bool success = aggregator1 == address(0) && aggregator2 == address(0);
        uint48 validAfter = uint48(Math.max(validAfter1, validAfter2));
        uint48 validUntil = uint48(Math.min(validUntil1, validUntil2));
        return packValidationData(success, validAfter, validUntil);
    }

    /// @dev Returns the aggregator of the `validationData` and whether it is out of time range.
    function getValidationData(uint256 validationData) internal view returns (address aggregator, bool outOfTimeRange) {
        (address aggregator_, uint48 validAfter, uint48 validUntil) = parseValidationData(validationData);
        return (aggregator_, block.timestamp < validAfter || validUntil < block.timestamp);
    }

    /// @dev Computes the hash of a user operation with the current entrypoint and chainid.
    function hash(PackedUserOperation calldata self) internal view returns (bytes32) {
        return hash(self, address(this), block.chainid);
    }

    /// @dev Sames as {hash}, but with a custom entrypoint and chainid.
    function hash(
        PackedUserOperation calldata self,
        address entrypoint,
        uint256 chainid
    ) internal pure returns (bytes32) {
        bytes32 result = keccak256(
            abi.encode(
                keccak256(
                    abi.encode(
                        self.sender,
                        self.nonce,
                        keccak256(self.initCode),
                        keccak256(self.callData),
                        self.accountGasLimits,
                        self.preVerificationGas,
                        self.gasFees,
                        keccak256(self.paymasterAndData)
                    )
                ),
                entrypoint,
                chainid
            )
        );
        return result;
    }

    /// @dev Returns `verificationGasLimit` from the {PackedUserOperation}.
    function verificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(0x00));
    }

    /// @dev Returns `accountGasLimits` from the {PackedUserOperation}.
    function callGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(0x10));
    }

    /// @dev Returns the first section of `gasFees` from the {PackedUserOperation}.
    function maxPriorityFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(0x00));
    }

    /// @dev Returns the second section of `gasFees` from the {PackedUserOperation}.
    function maxFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(0x10));
    }

    /// @dev Returns the total gas price for the {PackedUserOperation} (ie. `maxFeePerGas` or `maxPriorityFeePerGas + basefee`).
    function gasPrice(PackedUserOperation calldata self) internal view returns (uint256) {
        unchecked {
            // Following values are "per gas"
            uint256 maxPriorityFee = maxPriorityFeePerGas(self);
            uint256 maxFee = maxFeePerGas(self);
            return Math.ternary(maxFee == maxPriorityFee, maxFee, Math.min(maxFee, maxPriorityFee + block.basefee));
        }
    }

    /// @dev Returns the first section of `paymasterAndData` from the {PackedUserOperation}.
    function paymaster(PackedUserOperation calldata self) internal pure returns (address) {
        return address(bytes20(self.paymasterAndData[0:20]));
    }

    /// @dev Returns the second section of `paymasterAndData` from the {PackedUserOperation}.
    function paymasterVerificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(bytes16(self.paymasterAndData[20:36]));
    }

    /// @dev Returns the third section of `paymasterAndData` from the {PackedUserOperation}.
    function paymasterPostOpGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(bytes16(self.paymasterAndData[36:52]));
    }
}
