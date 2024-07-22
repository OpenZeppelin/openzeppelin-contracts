// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint, PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {Math} from "../../utils/math/Math.sol";
import {Call} from "../../utils/Call.sol";
import {Memory} from "../../utils/Memory.sol";
import {Packing} from "../../utils/Packing.sol";

library ERC4337Utils {
    using Packing for *;
    /*
     * For simulation purposes, validateUserOp (and validatePaymasterUserOp)
     * return this value on success.
     */
    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;

    /*
     * For simulation purposes, validateUserOp (and validatePaymasterUserOp)
     * must return this value in case of signature failure, instead of revert.
     */
    uint256 internal constant SIG_VALIDATION_FAILED = 1;

    // Validation data
    function parseValidationData(
        uint256 validationData
    ) internal pure returns (address aggregator, uint48 validAfter, uint48 validUntil) {
        validAfter = uint48(bytes32(validationData).extract_32_6(0x00));
        validUntil = uint48(bytes32(validationData).extract_32_6(0x06));
        aggregator = address(bytes32(validationData).extract_32_20(0x0c));
        if (validUntil == 0) validUntil = type(uint48).max;
    }

    function packValidationData(
        address aggregator,
        uint48 validAfter,
        uint48 validUntil
    ) internal pure returns (uint256) {
        return uint256(bytes6(validAfter).pack_6_6(bytes6(validUntil)).pack_12_20(bytes20(aggregator)));
    }

    function packValidationData(bool sigSuccess, uint48 validAfter, uint48 validUntil) internal pure returns (uint256) {
        return
            uint256(
                bytes6(validAfter).pack_6_6(bytes6(validUntil)).pack_12_20(
                    bytes20(uint160(Math.ternary(sigSuccess, SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED)))
                )
            );
    }

    function combineValidationData(uint256 validationData1, uint256 validationData2) internal pure returns (uint256) {
        (address aggregator1, uint48 validAfter1, uint48 validUntil1) = parseValidationData(validationData1);
        (address aggregator2, uint48 validAfter2, uint48 validUntil2) = parseValidationData(validationData2);

        bool success = aggregator1 == address(0) && aggregator2 == address(0);
        uint48 validAfter = uint48(Math.max(validAfter1, validAfter2));
        uint48 validUntil = uint48(Math.min(validUntil1, validUntil2));
        return packValidationData(success, validAfter, validUntil);
    }

    function getValidationData(uint256 validationData) internal view returns (address aggregator, bool outOfTimeRange) {
        if (validationData == 0) {
            return (address(0), false);
        } else {
            (address agregator, uint48 validAfter, uint48 validUntil) = parseValidationData(validationData);
            return (agregator, block.timestamp > validUntil || block.timestamp < validAfter);
        }
    }

    // Packed user operation
    function hash(PackedUserOperation calldata self) internal view returns (bytes32) {
        return hash(self, address(this), block.chainid);
    }

    function hash(
        PackedUserOperation calldata self,
        address entrypoint,
        uint256 chainid
    ) internal pure returns (bytes32) {
        Memory.FreePtr ptr = Memory.save();
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
        Memory.load(ptr);
        return result;
    }

    function verificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(0x00));
    }

    function callGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.accountGasLimits.extract_32_16(0x10));
    }

    function maxPriorityFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(0x00));
    }

    function maxFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(self.gasFees.extract_32_16(0x10));
    }

    function gasPrice(PackedUserOperation calldata self) internal view returns (uint256) {
        unchecked {
            // Following values are "per gas"
            uint256 maxPriorityFee = maxPriorityFeePerGas(self);
            uint256 maxFee = maxFeePerGas(self);
            return Math.ternary(maxFee == maxPriorityFee, maxFee, Math.min(maxFee, maxPriorityFee + block.basefee));
        }
    }

    function paymaster(PackedUserOperation calldata self) internal pure returns (address) {
        return address(bytes20(self.paymasterAndData[0:20]));
    }

    function paymasterVerificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(bytes16(self.paymasterAndData[20:36]));
    }

    function paymasterPostOpGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return uint128(bytes16(self.paymasterAndData[36:52]));
    }

    struct UserOpInfo {
        address sender;
        uint256 nonce;
        uint256 verificationGasLimit;
        uint256 callGasLimit;
        uint256 paymasterVerificationGasLimit;
        uint256 paymasterPostOpGasLimit;
        uint256 preVerificationGas;
        address paymaster;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes32 userOpHash;
        uint256 prefund;
        uint256 preOpGas;
        bytes context;
    }

    function load(UserOpInfo memory self, PackedUserOperation calldata source) internal view {
        self.sender = source.sender;
        self.nonce = source.nonce;
        self.verificationGasLimit = uint128(bytes32(source.accountGasLimits).extract_32_16(0x00));
        self.callGasLimit = uint128(bytes32(source.accountGasLimits).extract_32_16(0x10));
        self.preVerificationGas = source.preVerificationGas;
        self.maxPriorityFeePerGas = uint128(bytes32(source.gasFees).extract_32_16(0x00));
        self.maxFeePerGas = uint128(bytes32(source.gasFees).extract_32_16(0x10));

        if (source.paymasterAndData.length > 0) {
            require(source.paymasterAndData.length >= 52, "AA93 invalid paymasterAndData");
            self.paymaster = paymaster(source);
            self.paymasterVerificationGasLimit = paymasterVerificationGasLimit(source);
            self.paymasterPostOpGasLimit = paymasterPostOpGasLimit(source);
        } else {
            self.paymaster = address(0);
            self.paymasterVerificationGasLimit = 0;
            self.paymasterPostOpGasLimit = 0;
        }
        self.userOpHash = hash(source);
        self.prefund = 0;
        self.preOpGas = 0;
        self.context = "";
    }

    function requiredPrefund(UserOpInfo memory self) internal pure returns (uint256) {
        return
            (self.verificationGasLimit +
                self.callGasLimit +
                self.paymasterVerificationGasLimit +
                self.paymasterPostOpGasLimit +
                self.preVerificationGas) * self.maxFeePerGas;
    }

    function gasPrice(UserOpInfo memory self) internal view returns (uint256) {
        unchecked {
            uint256 maxFee = self.maxFeePerGas;
            uint256 maxPriorityFee = self.maxPriorityFeePerGas;
            return Math.ternary(maxFee == maxPriorityFee, maxFee, Math.min(maxFee, maxPriorityFee + block.basefee));
        }
    }
}
