// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (interfaces/draft-IERC4337.sol)

pragma solidity ^0.8.20;

/**
 * @dev A https://github.com/ethereum/ercs/blob/master/ERCS/erc-4337.md#useroperation[user operation] is composed of the following elements:
 * - `sender` (`address`): The account making the operation
 * - `nonce` (`uint256`): Anti-replay parameter (see “Semi-abstracted Nonce Support” )
 * - `factory` (`address`): account factory, only for new accounts
 * - `factoryData` (`bytes`): data for account factory (only if account factory exists)
 * - `callData` (`bytes`): The data to pass to the sender during the main execution call
 * - `callGasLimit` (`uint256`): The amount of gas to allocate the main execution call
 * - `verificationGasLimit` (`uint256`): The amount of gas to allocate for the verification step
 * - `preVerificationGas` (`uint256`): Extra gas to pay the bundler
 * - `maxFeePerGas` (`uint256`): Maximum fee per gas (similar to EIP-1559 max_fee_per_gas)
 * - `maxPriorityFeePerGas` (`uint256`): Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas)
 * - `paymaster` (`address`): Address of paymaster contract, (or empty, if account pays for itself)
 * - `paymasterVerificationGasLimit` (`uint256`): The amount of gas to allocate for the paymaster validation code
 * - `paymasterPostOpGasLimit` (`uint256`): The amount of gas to allocate for the paymaster post-operation code
 * - `paymasterData` (`bytes`): Data for paymaster (only if paymaster exists)
 * - `signature` (`bytes`): Data passed into the account to verify authorization
 *
 * When passed to on-chain contracts, the following packed version is used.
 * - `sender` (`address`)
 * - `nonce` (`uint256`)
 * - `initCode` (`bytes`): concatenation of factory address and factoryData (or empty)
 * - `callData` (`bytes`)
 * - `accountGasLimits` (`bytes32`): concatenation of verificationGas (16 bytes) and callGas (16 bytes)
 * - `preVerificationGas` (`uint256`)
 * - `gasFees` (`bytes32`): concatenation of maxPriorityFeePerGas (16 bytes) and maxFeePerGas (16 bytes)
 * - `paymasterAndData` (`bytes`): concatenation of paymaster fields (or empty)
 * - `signature` (`bytes`)
 */
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode; // `abi.encodePacked(factory, factoryData)`
    bytes callData;
    bytes32 accountGasLimits; // `abi.encodePacked(verificationGasLimit, callGasLimit)` 16 bytes each
    uint256 preVerificationGas;
    bytes32 gasFees; // `abi.encodePacked(maxPriorityFeePerGas, maxFeePerGas)` 16 bytes each
    bytes paymasterAndData; // `abi.encodePacked(paymaster, paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData)` (20 bytes, 16 bytes, 16 bytes, dynamic)
    bytes signature;
}

/**
 * @dev Aggregates and validates multiple signatures for a batch of user operations.
 *
 * A contract could implement this interface with custom validation schemes that allow signature aggregation,
 * enabling significant optimizations and gas savings for execution and transaction data cost.
 *
 * Bundlers and clients whitelist supported aggregators.
 *
 * See https://eips.ethereum.org/EIPS/eip-7766[ERC-7766]
 */
interface IAggregator {
    /**
     * @dev Validates the signature for a user operation.
     * Returns an alternative signature that should be used during bundling.
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
 *
 * Nonces are used in accounts as a replay protection mechanism and to ensure the order of user operations.
 * To avoid limiting the number of operations an account can perform, the interface allows using parallel
 * nonces by using a `key` parameter.
 *
 * See https://eips.ethereum.org/EIPS/eip-4337#semi-abstracted-nonce-support[ERC-4337 semi-abstracted nonce support].
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
 * @dev Handle stake management for entities (i.e. accounts, paymasters, factories).
 *
 * The EntryPoint must implement the following API to let entities like paymasters have a stake,
 * and thus have more flexibility in their storage access
 * (see https://eips.ethereum.org/EIPS/eip-4337#reputation-scoring-and-throttlingbanning-for-global-entities[reputation, throttling and banning.])
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
 *
 * User operations are validated and executed by this contract.
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
     * @param beneficiary Address to which gas is refunded upon completing the execution.
     */
    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external;

    /**
     * @dev Executes a batch of aggregated user operations per aggregator.
     * @param beneficiary Address to which gas is refunded upon completing the execution.
     */
    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;
}

/**
 * @dev Base interface for an ERC-4337 account.
 */
interface IAccount {
    /**
     * @dev Validates a user operation.
     *
     * * MUST validate the caller is a trusted EntryPoint
     * * MUST validate that the signature is a valid signature of the userOpHash, and SHOULD
     *   return SIG_VALIDATION_FAILED (and not revert) on signature mismatch. Any other error MUST revert.
     * * MUST pay the entryPoint (caller) at least the “missingAccountFunds” (which might
     *   be zero, in case the current account’s deposit is high enough)
     *
     * Returns an encoded packed validation data that is composed of the following elements:
     *
     * - `authorizer` (`address`): 0 for success, 1 for failure, otherwise the address of an authorizer contract
     * - `validUntil` (`uint48`): The UserOp is valid only up to this time. Zero for “infinite”.
     * - `validAfter` (`uint48`): The UserOp is valid only after this time.
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
     * @dev Validates whether the paymaster is willing to pay for the user operation. See
     * {IAccount-validateUserOp} for additional information on the return value.
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
     * @param actualGasCost the actual amount paid (by account or paymaster) for this UserOperation
     * @param actualUserOpFeePerGas total gas used by this UserOperation (including preVerification, creation, validation and execution)
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}
