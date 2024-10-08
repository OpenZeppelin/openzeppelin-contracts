// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev An user operation that can be executed by an account on its packed version.
 *
 * - `sender`: The account making the operation (might not be deployed yet).
 * - `nonce`: Anti-replay parameter handled by the entrypoint.
 * - `initCode`: Concatenation of the address of the factory and the factory calldata.
 * - `callData`: The `data` the sender will be called with.
 * - `accountGasLimits`: Concatenation of the verification step gas limit and the main call gas limit.
 * - `preVerificationGas`: Extra gas to pay the bundler before the verification step.
 * - `gasFees`: Maximum fee and priority fee the sender is willing to pay.
 * - `paymasterAndData`: Address of paymaster contract and calldata, (or empty, if account pays for itself).
 * - `signature`: Data passed into the account to verify authorization.
 */
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode; // `abi.encodePacked(factory, factoryData)`
    bytes callData;
    bytes32 accountGasLimits; // `abi.encodePacked(verificationGasLimit, callGasLimit)` 16 bytes each
    uint256 preVerificationGas;
    bytes32 gasFees; // `abi.encodePacked(maxPriorityFee, maxFeePerGas)` 16 bytes each
    bytes paymasterAndData; // `abi.encodePacked(paymaster, paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData)`
    bytes signature;
}

/**
 * @dev Aggregates and validates multiple signatures for a batch of user operations.
 */
interface IAggregator {
    /**
     * @dev Validates the signature for a user operation.
     */
    function validateUserOpSignature(
        PackedUserOperation calldata userOp
    ) external view returns (bytes memory sigForUserOp);

    /**
     * @dev Returns an aggregated signature for a batch of user operation's signatures.
     */
    function aggregateSignatures(
        PackedUserOperation[] calldata userOps
    ) external view returns (bytes memory aggregatesSignature);

    /**
     * @dev Validates that the aggregated signature is valid for the user operations.
     *
     * Requirements:
     *
     * - The aggregated signature MUST match the given list of operations.
     */
    function validateSignatures(PackedUserOperation[] calldata userOps, bytes calldata signature) external view;
}

/**
 * @dev Handle nonce management for accounts.
 */
interface IEntryPointNonces {
    /**
     * @dev Returns the nonce for a `sender` account and a `key`.
     *
     * Nonces for a certain `key` are always increasing.
     */
    function getNonce(address sender, uint192 key) external view returns (uint256 nonce);
}

/**
 * @dev Handle stake management for accounts.
 */
interface IEntryPointStake {
    /**
     * @dev Returns the balance of the account.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Deposits `msg.value` to the account.
     */
    function depositTo(address account) external payable;

    /**
     * @dev Withdraws `withdrawAmount` from the account to `withdrawAddress`.
     */
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;

    /**
     * @dev Adds stake to the account with an unstake delay of `unstakeDelaySec`.
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @dev Unlocks the stake of the account.
     */
    function unlockStake() external;

    /**
     * @dev Withdraws the stake of the account to `withdrawAddress`.
     */
    function withdrawStake(address payable withdrawAddress) external;
}

/**
 * @dev Entry point for user operations.
 */
interface IEntryPoint is IEntryPointNonces, IEntryPointStake {
    /**
     * @dev A user operation at `opIndex` failed with `reason`.
     */
    error FailedOp(uint256 opIndex, string reason);

    /**
     * @dev A user operation at `opIndex` failed with `reason` and `inner` returned data.
     */
    error FailedOpWithRevert(uint256 opIndex, string reason, bytes inner);

    /**
     * @dev Batch of aggregated user operations per aggregator.
     */
    struct UserOpsPerAggregator {
        PackedUserOperation[] userOps;
        IAggregator aggregator;
        bytes signature;
    }

    /**
     * @dev Executes a batch of user operations.
     */
    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external;

    /**
     * @dev Executes a batch of aggregated user operations per aggregator.
     */
    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;
}

/**
 * @dev Handle the simulation of user operations.
 */
interface IEntryPointSimulation {
    /**
     * @dev Result of executing a user operation.
     */
    struct ExecutionResult {
        uint256 preOpGas;
        uint256 paid;
        uint256 accountValidationData;
        uint256 paymasterValidationData;
        bool targetSuccess;
        bytes targetResult;
    }

    /**
     * @dev Result of validating a user operation.
     */
    struct ReturnInfo {
        uint256 preOpGas;
        uint256 prefund;
        uint256 accountValidationData;
        uint256 paymasterValidationData;
        bytes paymasterContext;
    }

    /**
     * @dev Information about the stake of an account.
     */
    struct StakeInfo {
        uint256 stake;
        uint256 unstakeDelaySec;
    }

    /**
     * @dev Information about the stake of an aggregator.
     */
    struct AggregatorStakeInfo {
        address aggregator;
        StakeInfo stakeInfo;
    }

    /**
     * @dev Result of simulating the validation of a user operation.
     */
    struct ValidationResult {
        ReturnInfo returnInfo;
        StakeInfo senderInfo;
        StakeInfo factoryInfo;
        StakeInfo paymasterInfo;
        AggregatorStakeInfo aggregatorInfo;
    }

    /**
     * @dev Simulates the validation of a user operation (i.e. {IAccount-validateUserOp} and {IPaymaster-validatePaymasterUserOp}).
     */
    function simulateValidation(PackedUserOperation calldata userOp) external returns (ValidationResult memory);

    /**
     * @dev Simulates the full execution of a user operation.
     */
    function simulateHandleOp(
        PackedUserOperation calldata op,
        address target,
        bytes calldata targetCallData
    ) external returns (ExecutionResult memory);
}

/**
 * @dev Base interface for an account.
 */
interface IAccount {
    /**
     * @dev Validates a user operation.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @dev Support for executing user operations by prepending the {executeUserOp} function selector
 * to the UserOperation's `callData`.
 */
interface IAccountExecute {
    /**
     * @dev Executes a user operation.
     */
    function executeUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) external;
}

/**
 * @dev Interface for a paymaster contract that agrees to pay for the gas costs of a user operation.
 *
 * NOTE: A paymaster must hold a stake to cover the required entrypoint stake and also the gas for the transaction.
 */
interface IPaymaster {
    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    /**
     * @dev Validates whether the paymaster is willing to pay for the user operation.
     *
     * NOTE: Bundlers will reject this method if it modifies the state, unless it's whitelisted.
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    /**
     * @dev Verifies the sender is the entrypoint.
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}
