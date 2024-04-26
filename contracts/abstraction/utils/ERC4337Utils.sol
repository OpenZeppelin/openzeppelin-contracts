// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint, PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {Math} from "../../utils/math/Math.sol";
import {Call} from "../../utils/Call.sol";
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
        aggregator = address(uint160(validationData));
        validUntil = uint48(validationData >> 160);
        validAfter = uint48(validationData >> 208);
        if (validUntil == 0) validUntil = type(uint48).max;
    }

    function packValidationData(
        address aggregator,
        uint48 validAfter,
        uint48 validUntil
    ) internal pure returns (uint256) {
        return uint160(aggregator) | (uint256(validUntil) << 160) | (uint256(validAfter) << 208);
    }

    function packValidationData(bool sigFailed, uint48 validUntil, uint48 validAfter) internal pure returns (uint256) {
        return
            (sigFailed ? SIG_VALIDATION_FAILED : SIG_VALIDATION_SUCCESS) |
            (uint256(validUntil) << 160) |
            (uint256(validAfter) << 208);
    }

    function getValidationData(uint256 validationData) internal view returns (address aggregator, bool outOfTimeRange) {
        if (validationData == 0) {
            return (address(0), false);
        } else {
            (address agregator, uint48 validAfter, uint48 validUntil) = parseValidationData(validationData);
            return (agregator, block.timestamp > validUntil || block.timestamp < validAfter);
        }
    }

    /*
    enum ErrorCodes {
        AA10_SENDER_ALREADY_CONSTRUCTED,
        AA13_INITCODE_FAILLED,
        AA14_INITCODE_WRONG_SENDER,
        AA15_INITCODE_NO_DEPLOYMENT,
        // Account
        AA21_MISSING_FUNDS,
        AA22_EXPIRED_OR_NOT_DUE,
        AA23_REVERTED,
        AA24_SIGNATURE_ERROR,
        AA25_INVALID_NONCE,
        AA26_OVER_VERIFICATION_GAS_LIMIT,
        // Paymaster
        AA31_MISSING_FUNDS,
        AA32_EXPIRED_OR_NOT_DUE,
        AA33_REVERTED,
        AA34_SIGNATURE_ERROR,
        AA36_OVER_VERIFICATION_GAS_LIMIT,
        // other
        AA95_OUT_OF_GAS
    }

    function toString(ErrorCodes err) internal pure returns (string memory) {
        if (err == ErrorCodes.AA10_SENDER_ALREADY_CONSTRUCTED) {
            return "AA10 sender already constructed";
        } else if (err == ErrorCodes.AA13_INITCODE_FAILLED) {
            return "AA13 initCode failed or OOG";
        } else if (err == ErrorCodes.AA14_INITCODE_WRONG_SENDER) {
            return "AA14 initCode must return sender";
        } else if (err == ErrorCodes.AA15_INITCODE_NO_DEPLOYMENT) {
            return "AA15 initCode must create sender";
        } else if (err == ErrorCodes.AA21_MISSING_FUNDS) {
            return "AA21 didn't pay prefund";
        } else if (err == ErrorCodes.AA22_EXPIRED_OR_NOT_DUE) {
            return "AA22 expired or not due";
        } else if (err == ErrorCodes.AA23_REVERTED) {
            return "AA23 reverted";
        } else if (err == ErrorCodes.AA24_SIGNATURE_ERROR) {
            return "AA24 signature error";
        } else if (err == ErrorCodes.AA25_INVALID_NONCE) {
            return "AA25 invalid account nonce";
        } else if (err == ErrorCodes.AA26_OVER_VERIFICATION_GAS_LIMIT) {
            return "AA26 over verificationGasLimit";
        } else if (err == ErrorCodes.AA31_MISSING_FUNDS) {
            return "AA31 paymaster deposit too low";
        } else if (err == ErrorCodes.AA32_EXPIRED_OR_NOT_DUE) {
            return "AA32 paymaster expired or not due";
        } else if (err == ErrorCodes.AA33_REVERTED) {
            return "AA33 reverted";
        } else if (err == ErrorCodes.AA34_SIGNATURE_ERROR) {
            return "AA34 signature error";
        } else if (err == ErrorCodes.AA36_OVER_VERIFICATION_GAS_LIMIT) {
            return "AA36 over paymasterVerificationGasLimit";
        } else if (err == ErrorCodes.AA95_OUT_OF_GAS) {
            return "AA95 out of gas";
        } else {
            return "Unknown error code";
        }
    }

    function failedOp(uint256 index, ErrorCodes err) internal pure {
        revert IEntryPoint.FailedOp(index, toString(err));
    }

    function failedOp(uint256 index, ErrorCodes err, bytes memory extraData) internal pure {
        revert IEntryPoint.FailedOpWithRevert(index, toString(err), extraData);
    }
    */

    // Packed user operation
    function hash(PackedUserOperation calldata self) internal pure returns (bytes32) {
        return keccak256(encode(self));
    }

    function encode(PackedUserOperation calldata self) internal pure returns (bytes memory ret) {
        return
            abi.encode(
                self.sender,
                self.nonce,
                keccak256(self.initCode),
                keccak256(self.callData),
                self.accountGasLimits,
                self.preVerificationGas,
                self.gasFees,
                keccak256(self.paymasterAndData)
            );
    }

    function verificationGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.accountGasLimits.asUint128x2().first();
    }

    function callGasLimit(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.accountGasLimits.asUint128x2().second();
    }

    function maxPriorityFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.gasFees.asUint128x2().first();
    }

    function maxFeePerGas(PackedUserOperation calldata self) internal pure returns (uint256) {
        return self.gasFees.asUint128x2().second();
    }

    function gasPrice(PackedUserOperation calldata self) internal view returns (uint256) {
        unchecked {
            // Following values are "per gas"
            (uint256 maxPriorityFee, uint256 maxFee) = self.gasFees.asUint128x2().split();
            return maxFee == maxPriorityFee ? maxFee : Math.min(maxFee, maxPriorityFee + block.basefee);
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
        (self.verificationGasLimit, self.callGasLimit) = source.accountGasLimits.asUint128x2().split();
        self.preVerificationGas = source.preVerificationGas;
        (self.maxPriorityFeePerGas, self.maxFeePerGas) = source.gasFees.asUint128x2().split();

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
        self.userOpHash = keccak256(abi.encode(hash(source), address(this), block.chainid));
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
            return maxFee == maxPriorityFee ? maxFee : Math.min(maxFee, maxPriorityFee + block.basefee);
        }
    }
}
