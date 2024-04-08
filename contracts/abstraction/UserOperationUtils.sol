// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {Math} from "../utils/math/Math.sol";
import {Packing} from "../utils/Packing.sol";

library UserOperationUtils {
    using Packing for *;

    function hash(PackedUserOperation calldata userOp) internal pure returns (bytes32) {
        return keccak256(encode(userOp));
    }

    function encode(PackedUserOperation calldata userOp) internal pure returns (bytes memory ret) {
        return
            abi.encode(
                userOp.sender,
                userOp.nonce,
                keccak256(userOp.initCode),
                keccak256(userOp.callData),
                userOp.accountGasLimits,
                userOp.preVerificationGas,
                userOp.gasFees,
                keccak256(userOp.paymasterAndData)
            );
    }

    function verificationGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.accountGasLimits.asUint128x2().first();
    }

    function callGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.accountGasLimits.asUint128x2().second();
    }

    function maxPriorityFeePerGas(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.gasFees.asUint128x2().first();
    }

    function maxFeePerGas(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.gasFees.asUint128x2().second();
    }

    function gasPrice(PackedUserOperation calldata userOp) internal view returns (uint256) {
        unchecked {
            // Following values are "per gas"
            (uint256 maxPriorityFee, uint256 maxFee) = userOp.gasFees.asUint128x2().split();
            return maxFee == maxPriorityFee ? maxFee : Math.min(maxFee, maxPriorityFee + block.basefee);
        }
    }

    function paymaster(PackedUserOperation calldata userOp) internal pure returns (address) {
        return address(bytes20(userOp.paymasterAndData[0:20]));
    }

    function paymasterVerificationGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return uint128(bytes16(userOp.paymasterAndData[20:36]));
    }

    function paymasterPostOpGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return uint128(bytes16(userOp.paymasterAndData[36:52]));
    }
}
