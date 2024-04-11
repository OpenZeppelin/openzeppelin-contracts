// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint, IEntryPointNonces, IEntryPointStake, IAccount, IAccountExecute, IAggregator, IPaymaster, PackedUserOperation} from "../interfaces/IERC4337.sol";

import {IERC165} from "../interfaces/IERC165.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {Address} from "../utils/Address.sol";
import {Call} from "../utils/Call.sol";
import {Memory} from "../utils/Memory.sol";
import {NoncesWithKey} from "../utils/NoncesWithKey.sol";
import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {ERC4337Utils} from "./ERC4337Utils.sol";
import {StakeManager} from "./StakeManager.sol";

/*
 * Account-Abstraction (EIP-4337) singleton EntryPoint implementation.
 * Only one instance required on each chain.
 */
contract EntryPoint is IEntryPoint, StakeManager, NoncesWithKey, ReentrancyGuard, ERC165 {
    using ERC4337Utils for *;

    // TODO: move to interface?
    event UserOperationEvent(
        bytes32 indexed userOpHash,
        address indexed sender,
        address indexed paymaster,
        uint256 nonce,
        bool success,
        uint256 actualGasCost,
        uint256 actualGasUsed
    );
    event AccountDeployed(bytes32 indexed userOpHash, address indexed sender, address factory, address paymaster);
    event UserOperationRevertReason(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce,
        bytes revertReason
    );
    event PostOpRevertReason(bytes32 indexed userOpHash, address indexed sender, uint256 nonce, bytes revertReason);
    event UserOperationPrefundTooLow(bytes32 indexed userOpHash, address indexed sender, uint256 nonce);
    event BeforeExecution();
    event SignatureAggregatorChanged(address indexed aggregator);
    error PostOpReverted(bytes returnData);
    error SignatureValidationFailed(address aggregator);
    error SenderAddressResult(address sender);

    //compensate for innerHandleOps' emit message and deposit refund.
    // allow some slack for future gas price changes.
    uint256 private constant INNER_GAS_OVERHEAD = 10000;
    bytes32 private constant INNER_OUT_OF_GAS = hex"deaddead";
    bytes32 private constant INNER_REVERT_LOW_PREFUND = hex"deadaa51";
    uint256 private constant REVERT_REASON_MAX_LEN = 2048;
    uint256 private constant PENALTY_PERCENT = 10;

    // TODO
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
        // || interfaceId == (type(IEntryPoint).interfaceId ^ type(IStakeManager).interfaceId ^ type(INonceManager).interfaceId)
        // || interfaceId == type(IEntryPoint).interfaceId
        // || interfaceId == type(IStakeManager).interfaceId
        // || interfaceId == type(INonceManager).interfaceId;
    }

    /**
     * Execute a user operation.
     * @param opIndex    - Index into the opInfo array.
     * @param userOp     - The userOp to execute.
     * @param opInfo     - The opInfo filled by validatePrepayment for this userOp.
     * @return collected - The total amount this userOp paid.
     */
    function _executeUserOp(
        uint256 opIndex,
        PackedUserOperation calldata userOp,
        ERC4337Utils.UserOpInfo memory opInfo
    ) internal returns (uint256 collected) {
        uint256 preGas = gasleft();

        // Allocate memory and reset the free memory pointer. Buffer for innerCall is not kept/protected
        Memory.FreePtr ptr = Memory.save();
        bytes memory innerCall = abi.encodeCall(
            this.innerHandleOp,
            (
                userOp.callData.length >= 0x04 && bytes4(userOp.callData[0:4]) == IAccountExecute.executeUserOp.selector
                    ? abi.encodeCall(IAccountExecute.executeUserOp, (userOp, opInfo.userOpHash))
                    : userOp.callData,
                opInfo
            )
        );
        Memory.load(ptr);

        bool success = Call.call(address(this), 0, innerCall);
        bytes32 result = abi.decode(Call.getReturnDataFixed(0x20), (bytes32));

        if (success) {
            collected = uint256(result);
        } else if (result == INNER_OUT_OF_GAS) {
            // handleOps was called with gas limit too low. abort entire bundle.
            //can only be caused by bundler (leaving not enough gas for inner call)
            revert FailedOp(opIndex, "AA95 out of gas");
        } else if (result == INNER_REVERT_LOW_PREFUND) {
            // innerCall reverted on prefund too low. treat entire prefund as "gas cost"
            uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            uint256 actualGasCost = opInfo.prefund;
            emit UserOperationPrefundTooLow(opInfo.userOpHash, opInfo.sender, opInfo.nonce);
            emit UserOperationEvent(
                opInfo.userOpHash,
                opInfo.sender,
                opInfo.paymaster,
                opInfo.nonce,
                success,
                actualGasCost,
                actualGas
            );
            collected = actualGasCost;
        } else {
            emit PostOpRevertReason(
                opInfo.userOpHash,
                opInfo.sender,
                opInfo.nonce,
                Call.getReturnData(REVERT_REASON_MAX_LEN)
            );

            uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            collected = _postExecution(IPaymaster.PostOpMode.postOpReverted, opInfo, actualGas);
        }
    }

    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) public nonReentrant {
        ERC4337Utils.UserOpInfo[] memory opInfos = new ERC4337Utils.UserOpInfo[](ops.length);

        for (uint256 i = 0; i < ops.length; ++i) {
            (uint256 validationData, uint256 pmValidationData) = _validatePrepayment(i, ops[i], opInfos[i]);
            _validateAccountAndPaymasterValidationData(i, validationData, pmValidationData, address(0));
        }

        emit BeforeExecution();

        uint256 collected = 0;
        for (uint256 i = 0; i < ops.length; ++i) {
            collected += _executeUserOp(i, ops[i], opInfos[i]);
        }

        Address.sendValue(beneficiary, collected);
    }

    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) public nonReentrant {
        uint256 totalOps = 0;
        for (uint256 i = 0; i < opsPerAggregator.length; ++i) {
            PackedUserOperation[] calldata ops = opsPerAggregator[i].userOps;
            IAggregator aggregator = opsPerAggregator[i].aggregator;

            //address(1) is special marker of "signature error"
            require(address(aggregator) != address(1), "AA96 invalid aggregator");
            if (address(aggregator) != address(0)) {
                // solhint-disable-next-line no-empty-blocks
                try aggregator.validateSignatures(ops, opsPerAggregator[i].signature) {} catch {
                    revert SignatureValidationFailed(address(aggregator));
                }
            }
            totalOps += ops.length;
        }

        ERC4337Utils.UserOpInfo[] memory opInfos = new ERC4337Utils.UserOpInfo[](totalOps);

        uint256 opIndex = 0;
        for (uint256 a = 0; a < opsPerAggregator.length; ++a) {
            PackedUserOperation[] calldata ops = opsPerAggregator[a].userOps;
            IAggregator aggregator = opsPerAggregator[a].aggregator;

            for (uint256 i = 0; i < ops.length; ++i) {
                (uint256 validationData, uint256 paymasterValidationData) = _validatePrepayment(
                    opIndex,
                    ops[i],
                    opInfos[opIndex]
                );
                _validateAccountAndPaymasterValidationData(
                    i,
                    validationData,
                    paymasterValidationData,
                    address(aggregator)
                );
                opIndex++;
            }
        }

        emit BeforeExecution();

        opIndex = 0;

        uint256 collected = 0;
        for (uint256 a = 0; a < opsPerAggregator.length; ++a) {
            PackedUserOperation[] calldata ops = opsPerAggregator[a].userOps;
            IAggregator aggregator = opsPerAggregator[a].aggregator;

            emit SignatureAggregatorChanged(address(aggregator));
            for (uint256 i = 0; i < ops.length; ++i) {
                collected += _executeUserOp(opIndex, ops[i], opInfos[opIndex]);
                opIndex++;
            }
        }
        emit SignatureAggregatorChanged(address(0));

        Address.sendValue(beneficiary, collected);
    }

    /**
     * Inner function to handle a UserOperation.
     * Must be declared "external" to open a call context, but it can only be called by handleOps.
     * @param callData - The callData to execute.
     * @param opInfo   - The UserOpInfo struct.
     * @return actualGasCost - the actual cost in eth this UserOperation paid for gas
     */
    function innerHandleOp(
        bytes memory callData,
        ERC4337Utils.UserOpInfo memory opInfo
    ) external returns (uint256 actualGasCost) {
        uint256 preGas = gasleft();
        require(msg.sender == address(this), "AA92 internal call only");

        unchecked {
            // handleOps was called with gas limit too low. abort entire bundle.
            if ((gasleft() * 63) / 64 < opInfo.callGasLimit + opInfo.paymasterPostOpGasLimit + INNER_GAS_OVERHEAD) {
                Call.revertWithCode(INNER_OUT_OF_GAS);
            }

            IPaymaster.PostOpMode mode;
            if (callData.length == 0 || Call.call(opInfo.sender, 0, callData, opInfo.callGasLimit)) {
                mode = IPaymaster.PostOpMode.opSucceeded;
            } else {
                mode = IPaymaster.PostOpMode.opReverted;
                // if we get here, that means callData.length > 0 and the Call failed
                if (Call.getReturnDataSize() > 0) {
                    emit UserOperationRevertReason(
                        opInfo.userOpHash,
                        opInfo.sender,
                        opInfo.nonce,
                        Call.getReturnData(REVERT_REASON_MAX_LEN)
                    );
                }
            }

            uint256 actualGas = preGas - gasleft() + opInfo.preOpGas;
            return _postExecution(mode, opInfo, actualGas);
        }
    }

    /**
     * Create sender smart contract account if init code is provided.
     * @param opIndex  - The operation index.
     * @param opInfo   - The operation info.
     * @param initCode - The init code for the smart contract account.
     */
    function _createSenderIfNeeded(
        uint256 opIndex,
        ERC4337Utils.UserOpInfo memory opInfo,
        bytes calldata initCode
    ) internal {
        if (initCode.length != 0) {
            address sender = opInfo.sender;
            if (sender.code.length != 0) revert FailedOp(opIndex, "AA10 sender already constructed");

            address deployed = ERC4337Utils.createSender(initCode, opInfo.verificationGasLimit);
            if (deployed == address(0)) revert FailedOp(opIndex, "AA13 initCode failed or OOG");
            else if (deployed != sender) revert FailedOp(opIndex, "AA14 initCode must return sender");
            else if (deployed.code.length == 0) revert FailedOp(opIndex, "AA15 initCode must create sender");

            emit AccountDeployed(opInfo.userOpHash, sender, address(bytes20(initCode[0:20])), opInfo.paymaster);
        }
    }

    function getSenderAddress(bytes calldata initCode) public {
        revert SenderAddressResult(ERC4337Utils.createSender(initCode, gasleft()));
    }

    /**
     * Call account.validateUserOp.
     * Revert (with FailedOp) in case validateUserOp reverts, or account didn't send required prefund.
     * Decrement account's deposit if needed.
     * @param opIndex         - The operation index.
     * @param op              - The user operation.
     * @param opInfo          - The operation info.
     * @param requiredPrefund - The required prefund amount.
     */
    function _validateAccountPrepayment(
        uint256 opIndex,
        PackedUserOperation calldata op,
        ERC4337Utils.UserOpInfo memory opInfo,
        uint256 requiredPrefund
    ) internal returns (uint256 validationData) {
        unchecked {
            address sender = opInfo.sender;
            address paymaster = opInfo.paymaster;
            uint256 verificationGasLimit = opInfo.verificationGasLimit;

            _createSenderIfNeeded(opIndex, opInfo, op.initCode);

            uint256 missingAccountFunds = 0;
            if (paymaster == address(0)) {
                uint256 balance = balanceOf(sender);
                if (requiredPrefund > balance) {
                    missingAccountFunds = requiredPrefund - balance;
                }
            }

            try
                IAccount(sender).validateUserOp{gas: verificationGasLimit}(op, opInfo.userOpHash, missingAccountFunds)
            returns (uint256 _validationData) {
                validationData = _validationData;
            } catch {
                revert FailedOpWithRevert(opIndex, "AA23 reverted", Call.getReturnData(REVERT_REASON_MAX_LEN));
            }

            if (paymaster == address(0)) {
                uint256 balance = balanceOf(sender);
                if (requiredPrefund > balance) {
                    revert FailedOp(opIndex, "AA21 didn't pay prefund");
                } else if (requiredPrefund > 0) {
                    _decrementDeposit(sender, requiredPrefund);
                }
            }
        }
    }

    /**
     * In case the request has a paymaster:
     *  - Validate paymaster has enough deposit.
     *  - Call paymaster.validatePaymasterUserOp.
     *  - Revert with proper FailedOp in case paymaster reverts.
     *  - Decrement paymaster's deposit.
     * @param opIndex                            - The operation index.
     * @param op                                 - The user operation.
     * @param opInfo                             - The operation info.
     * @param requiredPrefund                    - The required prefund amount.
     */
    function _validatePaymasterPrepayment(
        uint256 opIndex,
        PackedUserOperation calldata op,
        ERC4337Utils.UserOpInfo memory opInfo,
        uint256 requiredPrefund
    ) internal returns (bytes memory context, uint256 validationData) {
        unchecked {
            uint256 preGas = gasleft();

            address paymaster = opInfo.paymaster;
            uint256 verificationGasLimit = opInfo.paymasterVerificationGasLimit;

            uint256 balance = balanceOf(paymaster);
            if (requiredPrefund > balance) {
                revert FailedOp(opIndex, "AA31 paymaster deposit too low");
            } else if (requiredPrefund > 0) {
                _decrementDeposit(paymaster, requiredPrefund);
            }

            try
                IPaymaster(paymaster).validatePaymasterUserOp{gas: verificationGasLimit}(
                    op,
                    opInfo.userOpHash,
                    requiredPrefund
                )
            returns (bytes memory _context, uint256 _validationData) {
                context = _context;
                validationData = _validationData;
            } catch {
                revert FailedOpWithRevert(opIndex, "AA33 reverted", Call.getReturnData(REVERT_REASON_MAX_LEN));
            }

            if (preGas - gasleft() > verificationGasLimit) {
                revert FailedOp(opIndex, "AA36 over paymasterVerificationGasLimit");
            }
        }
    }

    /**
     * Revert if either account validationData or paymaster validationData is expired.
     * @param opIndex                 - The operation index.
     * @param validationData          - The account validationData.
     * @param paymasterValidationData - The paymaster validationData.
     * @param expectedAggregator      - The expected aggregator.
     */
    function _validateAccountAndPaymasterValidationData(
        uint256 opIndex,
        uint256 validationData,
        uint256 paymasterValidationData,
        address expectedAggregator
    ) internal view {
        (address aggregator, bool aggregatorOutOfTimeRange) = validationData.getValidationData();
        if (aggregator != expectedAggregator) {
            revert FailedOp(opIndex, "AA24 signature error");
        } else if (aggregatorOutOfTimeRange) {
            revert FailedOp(opIndex, "AA22 expired or not due");
        }
        // pmAggregator is not a real signature aggregator: we don't have logic to handle it as address.
        // Non-zero address means that the paymaster fails due to some signature check (which is ok only during estimation).
        (address pmAggregator, bool pmAggregatorOutOfTimeRange) = paymasterValidationData.getValidationData();
        if (pmAggregator != address(0)) {
            revert FailedOp(opIndex, "AA34 signature error");
        } else if (pmAggregatorOutOfTimeRange) {
            revert FailedOp(opIndex, "AA32 paymaster expired or not due");
        }
    }

    /**
     * Validate account and paymaster (if defined) and
     * also make sure total validation doesn't exceed verificationGasLimit.
     * This method is called off-chain (simulateValidation()) and on-chain (from handleOps)
     * @param opIndex - The index of this userOp into the "opInfos" array.
     * @param userOp  - The userOp to validate.
     */
    function _validatePrepayment(
        uint256 opIndex,
        PackedUserOperation calldata userOp,
        ERC4337Utils.UserOpInfo memory outOpInfo
    ) internal returns (uint256 validationData, uint256 paymasterValidationData) {
        uint256 preGas = gasleft();
        unchecked {
            outOpInfo.load(userOp);

            // Validate all numeric values in userOp are well below 128 bit, so they can safely be added
            // and multiplied without causing overflow.
            uint256 maxGasValues = outOpInfo.preVerificationGas |
                outOpInfo.verificationGasLimit |
                outOpInfo.callGasLimit |
                outOpInfo.paymasterVerificationGasLimit |
                outOpInfo.paymasterPostOpGasLimit |
                outOpInfo.maxFeePerGas |
                outOpInfo.maxPriorityFeePerGas;

            if (maxGasValues > type(uint120).max) {
                revert FailedOp(opIndex, "AA94 gas values overflow");
            }

            uint256 requiredPreFund = outOpInfo.requiredPrefund();
            validationData = _validateAccountPrepayment(opIndex, userOp, outOpInfo, requiredPreFund);

            if (!_tryUseNonce(outOpInfo.sender, outOpInfo.nonce)) {
                revert FailedOp(opIndex, "AA25 invalid account nonce");
            }

            if (preGas - gasleft() > outOpInfo.verificationGasLimit) {
                revert FailedOp(opIndex, "AA26 over verificationGasLimit");
            }

            if (outOpInfo.paymaster != address(0)) {
                (outOpInfo.context, paymasterValidationData) = _validatePaymasterPrepayment(
                    opIndex,
                    userOp,
                    outOpInfo,
                    requiredPreFund
                );
            }

            outOpInfo.prefund = requiredPreFund;
            outOpInfo.preOpGas = preGas - gasleft() + userOp.preVerificationGas;
        }
    }

    /**
     * Process post-operation, called just after the callData is executed.
     * If a paymaster is defined and its validation returned a non-empty context, its postOp is called.
     * The excess amount is refunded to the account (or paymaster - if it was used in the request).
     * @param mode      - Whether is called from innerHandleOp, or outside (postOpReverted).
     * @param opInfo    - UserOp fields and info collected during validation.
     * @param actualGas - The gas used so far by this user operation.
     */
    function _postExecution(
        IPaymaster.PostOpMode mode,
        ERC4337Utils.UserOpInfo memory opInfo,
        uint256 actualGas
    ) private returns (uint256 actualGasCost) {
        uint256 preGas = gasleft();
        unchecked {
            address refundAddress = opInfo.paymaster;
            uint256 gasPrice = opInfo.gasPrice();

            if (refundAddress == address(0)) {
                refundAddress = opInfo.sender;
            } else if (opInfo.context.length > 0 && mode != IPaymaster.PostOpMode.postOpReverted) {
                try
                    IPaymaster(refundAddress).postOp{gas: opInfo.paymasterPostOpGasLimit}(
                        mode,
                        opInfo.context,
                        actualGas * gasPrice,
                        gasPrice
                    )
                {} catch {
                    revert PostOpReverted(Call.getReturnData(REVERT_REASON_MAX_LEN));
                }
            }
            actualGas += preGas - gasleft();

            // Calculating a penalty for unused execution gas
            uint256 executionGasLimit = opInfo.callGasLimit + opInfo.paymasterPostOpGasLimit;
            uint256 executionGasUsed = actualGas - opInfo.preOpGas;
            // this check is required for the gas used within EntryPoint and not covered by explicit gas limits
            if (executionGasLimit > executionGasUsed) {
                actualGas += ((executionGasLimit - executionGasUsed) * PENALTY_PERCENT) / 100;
            }

            actualGasCost = actualGas * gasPrice;
            uint256 prefund = opInfo.prefund;
            if (prefund < actualGasCost) {
                if (mode == IPaymaster.PostOpMode.postOpReverted) {
                    actualGasCost = prefund;
                    emit UserOperationPrefundTooLow(opInfo.userOpHash, opInfo.sender, opInfo.nonce);
                } else {
                    Call.revertWithCode(INNER_REVERT_LOW_PREFUND);
                }
            } else if (prefund > actualGasCost) {
                _incrementDeposit(refundAddress, prefund - actualGasCost);
            }
            emit UserOperationEvent(
                opInfo.userOpHash,
                opInfo.sender,
                opInfo.paymaster,
                opInfo.nonce,
                mode == IPaymaster.PostOpMode.opSucceeded,
                actualGasCost,
                actualGas
            );
        }
    }

    function getNonce(
        address owner,
        uint192 key
    ) public view virtual override(IEntryPointNonces, NoncesWithKey) returns (uint256) {
        return super.getNonce(owner, key);
    }
}
