// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {Math} from "../utils/math/Math.sol";
import {Packing} from "../utils/Packing.sol";

library UserOperationUtils {
    using Packing for *;

    /// Calldata
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

    function createSenderIfNeeded(PackedUserOperation calldata userOp) internal returns (address) {
        address sender = userOp.sender;

        if (sender.code.length == 0) {
            require(userOp.initCode.length >= 20, "Missing init code");

            (bool success, bytes memory returndata) = address(bytes20(userOp.initCode[0:20])).call{ gas: verificationGasLimit(userOp) }(userOp.initCode[20:]);

            require(success && returndata.length >= 0x20, "InitCode failed or OOG");
            require(sender == abi.decode(returndata, (address)), "InitCode must return sender");
            require(sender.code.length != 0, "InitCode must create sender");

            // TODO - emit event
        }
        return sender;
    }

    /// Memory
    struct MemoryUserOp {
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
    }

    function load(MemoryUserOp memory self, PackedUserOperation calldata source) internal pure {
        self.sender = source.sender;
        self.nonce  = source.nonce;
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
    }

    function requiredPrefund(MemoryUserOp memory self) internal pure returns (uint256) {
        return (
            self.verificationGasLimit +
            self.callGasLimit +
            self.paymasterVerificationGasLimit +
            self.paymasterPostOpGasLimit +
            self.preVerificationGas
        ) * self.maxFeePerGas;
    }
}
