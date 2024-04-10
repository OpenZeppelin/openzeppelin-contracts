// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {
    PackedUserOperation,
    IEntryPoint,
    IAggregator,
    IAccount,
    IAccountExecute
} from "../interfaces/IERC4337.sol";

import {UserOperationUtils} from "./UserOperationUtils.sol";
import {Address} from "../utils/Address.sol";
import {Packing} from "../utils/Packing.sol";
import {ReentrancyGuardTransient} from "../utils/ReentrancyGuardTransient.sol";







contract KeydNonces {
    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidAccountNonce(address account, uint256 currentNonce);

    mapping(address => mapping(uint192 => uint64)) private _nonce;

    function getNonce(address owner, uint192 key) public view virtual returns (uint256) {
        return (uint256(key) << 64) | _nonce[owner][key];
    }

    function _useNonce(address owner, uint192 key) internal virtual returns (uint64) {
        // TODO: use unchecked here ?
        return _nonce[owner][key]++;
    }

    function _useCheckedNonce(address owner, uint256 keyNonce) internal {
        _useCheckedNonce(owner, uint192(keyNonce >> 64), uint64(keyNonce));
    }

    function _useCheckedNonce(address owner, uint192 key, uint64 nonce) internal virtual {
        uint256 current = _useNonce(owner, key);
        if (nonce != current) {
            revert InvalidAccountNonce(owner, current);
        }
    }
}






contract EntryPoint is IEntryPoint, ReentrancyGuardTransient, KeydNonces {
    using UserOperationUtils for *;
    using Packing for *;

    struct UserOpInfo {
        UserOperationUtils.MemoryUserOp mUserOp;
        bytes32 userOpHash;
        uint256 prefund;
        uint256 preOpGas;
        bytes context;
    }




    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external nonReentrant {
        UserOpInfo[] memory opInfos = new UserOpInfo[](ops.length);

        for (uint256 i = 0; i < ops.length; ++i) {
            (
                uint256 validationData,
                uint256 pmValidationData
            ) = _validatePrepayment(ops[i], opInfos[i]);

            _validateAccountAndPaymasterValidationData(
                validationData,
                pmValidationData,
                address(0)
            );
        }

        uint256 collected = 0;
        for (uint256 i = 0; i < ops.length; ++i) {
            collected += _executeUserOp(ops[i], opInfos[i]);
        }

        Address.sendValue(beneficiary, collected);
    }

    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external nonReentrant {
        uint256 totalOps = 0;
        for (uint256 i = 0; i < opsPerAggregator.length; ++i) {
            PackedUserOperation[] calldata ops = opsPerAggregator[i].userOps;
            IAggregator aggregator = opsPerAggregator[i].aggregator;

            //address(1) is special marker of "signature error"
            require(address(aggregator) != address(1), "AA96 invalid aggregator");

            if (address(aggregator) != address(0)) {
                // solhint-disable-next-line no-empty-blocks
                try aggregator.validateSignatures(ops, opsPerAggregator[i].signature)
                {}
                catch
                {
                    revert("SignatureValidationFailed");
                    // revert SignatureValidationFailed(address(aggregator));
                }
            }
            totalOps += ops.length;
        }

        UserOpInfo[] memory opInfos = new UserOpInfo[](totalOps);

        uint256 opIndex = 0;
        for (uint256 a = 0; a < opsPerAggregator.length; ++a) {
            PackedUserOperation[] calldata ops = opsPerAggregator[a].userOps;
            IAggregator aggregator = opsPerAggregator[a].aggregator;

            for (uint256 i = 0; i < ops.length; ++i) {
                (
                    uint256 validationData,
                    uint256 paymasterValidationData
                ) = _validatePrepayment(ops[i], opInfos[opIndex]);

                _validateAccountAndPaymasterValidationData(
                    validationData,
                    paymasterValidationData,
                    address(aggregator)
                );
                opIndex++;
            }
        }

        uint256 collected = 0;

        opIndex = 0;
        for (uint256 a = 0; a < opsPerAggregator.length; ++a) {
            PackedUserOperation[] calldata ops = opsPerAggregator[a].userOps;

            for (uint256 i = 0; i < ops.length; ++i) {
                collected += _executeUserOp(ops[i], opInfos[opIndex]);
                opIndex++;
            }
        }

        Address.sendValue(beneficiary, collected);
    }



    function getNonce(address owner, uint192 key) public view virtual override(IEntryPoint, KeydNonces) returns (uint256) {
        return super.getNonce(owner, key);
    }









    function _validatePrepayment(PackedUserOperation calldata userOp, UserOpInfo memory outOpInfo)
        internal
        returns (uint256 validationData, uint256 paymasterValidationData)
    {
        unchecked {
            uint256 preGas = gasleft();

            outOpInfo.mUserOp.load(userOp);
            outOpInfo.userOpHash = userOp.hash();

            // Validate all numeric values in userOp are well below 128 bit, so they can safely be added
            // and multiplied without causing overflow.
            uint256 maxGasValues =
                outOpInfo.mUserOp.preVerificationGas |
                outOpInfo.mUserOp.verificationGasLimit |
                outOpInfo.mUserOp.callGasLimit |
                outOpInfo.mUserOp.paymasterVerificationGasLimit |
                outOpInfo.mUserOp.paymasterPostOpGasLimit |
                outOpInfo.mUserOp.maxFeePerGas |
                outOpInfo.mUserOp.maxPriorityFeePerGas;
            require(maxGasValues <= type(uint120).max, "AA94 gas values overflow");

            validationData = _validateAccountPrepayment(userOp, outOpInfo);
            _useCheckedNonce(outOpInfo.mUserOp.sender, outOpInfo.mUserOp.nonce);

            require (preGas - gasleft() <= outOpInfo.mUserOp.verificationGasLimit, "AA26 over verificationGasLimit");

            if (outOpInfo.mUserOp.paymaster != address(0)) {
                // (outOpInfo.mUserOp.context, paymasterValidationData) = _validatePaymasterPrepayment(
                //     opIndex,
                //     userOp,
                //     outOpInfo,
                //     requiredPreFund
                // );
            } else {
                paymasterValidationData = 0;
            }

            outOpInfo.prefund  = outOpInfo.mUserOp.requiredPrefund();
            outOpInfo.preOpGas = preGas - gasleft() + userOp.preVerificationGas;
        }
    }

    function _validateAccountPrepayment(PackedUserOperation calldata userOp, UserOpInfo memory /*outOpInfo*/)
        internal
        returns (uint256 validationData)
    {

        unchecked {
            address sender              = userOp.createSenderIfNeeded();
            address paymaster           = userOp.paymaster();
            uint256 missingAccountFunds = 0;

            // uint256 requiredPrefund = outOpInfo.mUserOp.requiredPrefund();
            if (paymaster == address(0)) {
                //TODO
                // uint256 bal = balanceOf(sender);
                // missingAccountFunds = bal > requiredPrefund ? 0 : requiredPrefund - bal; // TODO: use select
            }

            try IAccount(sender).validateUserOp{ gas: userOp.verificationGasLimit() }(userOp, userOp.hash(), missingAccountFunds) returns (uint256 _validationData) {
                validationData = _validationData;
            } catch (bytes memory /*returndata*/) {
                // TODO return bombing?
                // revert FailedOpWithRevert(opIndex, "AA23 reverted", Exec.getReturnData(REVERT_REASON_MAX_LEN));
                revert('Reverted');
            }

            if (paymaster == address(0)) {
                // TODO
                // DepositInfo storage senderInfo = deposits[sender];
                // uint256 deposit = senderInfo.deposit;
                // if (requiredPrefund > deposit) {
                //     revert FailedOp(opIndex, "AA21 didn't pay prefund");
                // }
                // senderInfo.deposit = deposit - requiredPrefund;
            }
        }
    }

    function _validateAccountAndPaymasterValidationData(uint256 validationData, uint256 paymasterValidationData, address expectedAggregator)
        internal
        view
    {
        (address aggregator, bool outOfTimeRange) = _parseValidationData(validationData);

        require(expectedAggregator == aggregator, "AA24 signature error");
        require(!outOfTimeRange, "AA22 expired or not due");
        // pmAggregator is not a real signature aggregator: we don't have logic to handle it as address.
        // Non-zero address means that the paymaster fails due to some signature check (which is ok only during estimation).
        address pmAggregator;
        (pmAggregator, outOfTimeRange) = _parseValidationData(paymasterValidationData);

        require(pmAggregator == address(0), "AA34 signature error");
        require(!outOfTimeRange, "AA32 paymaster expired or not due");
    }

    function _parseValidationData(uint256 validationData)
        internal
        view
        returns (address aggregator, bool outOfTimeRange)
    {
        return validationData == 0
            ? (address(0), false)
            : (
                validationData.asAddressUint48x2().first(),
                block.timestamp > validationData.asAddressUint48x2().second() || block.timestamp < validationData.asAddressUint48x2().third()
            );
    }

    function _executeUserOp(PackedUserOperation calldata userOp, UserOpInfo memory opInfo)
        internal
        returns (uint256 collected)
    {
        // uint256 preGas = gasleft();

        uint256 saveFreePtr;
        assembly ("memory-safe") {
            saveFreePtr := mload(0x40)
        }

        bytes memory innerCall = bytes4(userOp.callData[0:4]) == IAccountExecute.executeUserOp.selector
            ? abi.encodeCall(this.innerHandleOp, (abi.encodeCall(IAccountExecute.executeUserOp, (userOp, opInfo.userOpHash)), opInfo, opInfo.context))
            : abi.encodeCall(this.innerHandleOp, (userOp.callData, opInfo, opInfo.context));

        (bool success, bytes memory returndata) = address(this).call(innerCall);
        if (success && returndata.length >= 0x20) {
            collected = abi.decode(returndata, (uint256));
        } else {
            // bytes32 innerRevertCode = abi.decode(returndata, (bytes32));

            // TODO
            // if (innerRevertCode == INNER_OUT_OF_GAS) {
            //     // handleOps was called with gas limit too low. abort entire bundle.
            //     //can only be caused by bundler (leaving not enough gas for inner call)
            //     revert FailedOp(opIndex, "AA95 out of gas");
            // } else if (innerRevertCode == INNER_REVERT_LOW_PREFUND) {
            //     // innerCall reverted on prefund too low. treat entire prefund as "gas cost"
            //     uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            //     uint256 actualGasCost = opInfo.prefund;
            //     emitPrefundTooLow(opInfo);
            //     emitUserOperationEvent(opInfo, false, actualGasCost, actualGas);
            //     collected = actualGasCost;
            // } else {
            //     emit PostOpRevertReason(
            //         opInfo.userOpHash,
            //         opInfo.mUserOp.sender,
            //         opInfo.mUserOp.nonce,
            //         Exec.getReturnData(REVERT_REASON_MAX_LEN)
            //     );

            //     uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            //     collected = _postExecution(
            //         IPaymaster.PostOpMode.postOpReverted,
            //         opInfo,
            //         opInfo.context,
            //         actualGas
            //     );
            // }
        }

        assembly ("memory-safe") {
            mstore(0x40, saveFreePtr)
        }
    }







    function innerHandleOp(bytes memory callData, UserOpInfo memory opInfo, bytes calldata context)
        external
        returns (uint256 actualGasCost)
    {
    //TODO
    //     uint256 preGas = gasleft();

    //     require(msg.sender == address(this), "AA92 internal call only");
    //     uint256 callGasLimit = opInfo.mUserOp.callGasLimit;
    //     unchecked {
    //         // handleOps was called with gas limit too low. abort entire bundle.
    //         if (
    //             gasleft() * 63 / 64 <
    //             callGasLimit +
    //             opInfo.mUserOp.paymasterPostOpGasLimit +
    //             // INNER_GAS_OVERHEAD // TODO
    //             10_000
    //         ) {
    //             assembly ("memory-safe") {
    //                 mstore(0, INNER_OUT_OF_GAS)
    //                 revert(0, 32)
    //             }
    //         }
    //     }

    //     IPaymaster.PostOpMode mode = IPaymaster.PostOpMode.opSucceeded;
    //     if (callData.length > 0) {
    //         bool success = Exec.call(opInfo.mUserOp.sender, 0, callData, callGasLimit);
    //         if (!success) {
    //             bytes memory result = Exec.getReturnData(REVERT_REASON_MAX_LEN);
    //             if (result.length > 0) {
    //                 emit UserOperationRevertReason(
    //                     opInfo.userOpHash,
    //                     opInfo.mUserOp.sender,
    //                     opInfo.mUserOp.nonce,
    //                     result
    //                 );
    //             }
    //             mode = IPaymaster.PostOpMode.opReverted;
    //         }
    //     }

    //     unchecked {
    //         uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
    //         return _postExecution(mode, opInfo, context, actualGas);
    //     }
    }
}