// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {Math} from "../utils/math/Math.sol";

// TODO: move that to a dedicated file in `contracts/utils/math` ?
library Unpack {
    function split(bytes32 packed) internal pure returns (uint256 high128, uint256 low128) {
        return (uint128(bytes16(packed)), uint128(uint256(packed)));
    }

    function high(bytes32 packed) internal pure returns (uint256) {
        return uint256(packed) >> 128;
    }

    function low(bytes32 packed) internal pure returns (uint256) {
        return uint128(uint256(packed));
    }
}

library UserOperationUtils {
    using Unpack for bytes32;

    uint256 public constant PAYMASTER_VALIDATION_GAS_OFFSET = 20;
    uint256 public constant PAYMASTER_POSTOP_GAS_OFFSET = 36;
    uint256 public constant PAYMASTER_DATA_OFFSET = 52;

    // Need to fuzz this against `userOp.sender`
    function getSender(PackedUserOperation calldata userOp) internal pure returns (address) {
        address data;
        assembly {
            data := calldataload(userOp)
        }
        return address(uint160(data));
    }

    function getMaxPriorityFeePerGas(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.gasFees.high();
    }

    function getMaxFeePerGas(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.gasFees.low();
    }

    function getGasPrice(PackedUserOperation calldata userOp) internal view returns (uint256) {
        unchecked {
            (uint256 maxPriorityFeePerGas, uint256 maxFeePerGas) = userOp.gasFees.split();
            return
                maxFeePerGas == maxPriorityFeePerGas
                    ? maxFeePerGas
                    : Math.min(maxFeePerGas, maxPriorityFeePerGas + block.basefee);
        }
    }

    function getVerificationGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.accountGasLimits.high();
    }

    function getCallGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return userOp.accountGasLimits.low();
    }

    function getPaymasterVerificationGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return uint128(bytes16(userOp.paymasterAndData[PAYMASTER_VALIDATION_GAS_OFFSET:PAYMASTER_POSTOP_GAS_OFFSET]));
    }

    function getPostOpGasLimit(PackedUserOperation calldata userOp) internal pure returns (uint256) {
        return uint128(bytes16(userOp.paymasterAndData[PAYMASTER_POSTOP_GAS_OFFSET:PAYMASTER_DATA_OFFSET]));
    }

    function getPaymasterStaticFields(
        bytes calldata paymasterAndData
    ) internal pure returns (address paymaster, uint256 validationGasLimit, uint256 postOpGasLimit) {
        return (
            address(bytes20(paymasterAndData[:PAYMASTER_VALIDATION_GAS_OFFSET])),
            uint128(bytes16(paymasterAndData[PAYMASTER_VALIDATION_GAS_OFFSET:PAYMASTER_POSTOP_GAS_OFFSET])),
            uint128(bytes16(paymasterAndData[PAYMASTER_POSTOP_GAS_OFFSET:PAYMASTER_DATA_OFFSET]))
        );
    }

    function encode(PackedUserOperation calldata userOp) internal pure returns (bytes memory ret) {
        return
            abi.encode(
                userOp.sender,
                userOp.nonce,
                calldataKeccak(userOp.initCode),
                calldataKeccak(userOp.callData),
                userOp.accountGasLimits,
                userOp.preVerificationGas,
                userOp.gasFees,
                calldataKeccak(userOp.paymasterAndData)
            );
    }

    function hash(PackedUserOperation calldata userOp) internal pure returns (bytes32) {
        return keccak256(encode(userOp));
    }

    function calldataKeccak(bytes calldata data) private pure returns (bytes32 ret) {
        assembly ("memory-safe") {
            let ptr := mload(0x40)
            let len := data.length
            calldatacopy(ptr, data.offset, len)
            ret := keccak256(ptr, len)
        }
    }
}
