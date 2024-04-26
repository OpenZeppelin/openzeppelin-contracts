// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/*
struct UserOperation {
    address sender; // The account making the operation
    uint256 nonce; // Anti-replay parameter (see “Semi-abstracted Nonce Support” )
    address factory; // account factory, only for new accounts
    bytes factoryData; // data for account factory (only if account factory exists)
    bytes callData; // The data to pass to the sender during the main execution call
    uint256 callGasLimit; // The amount of gas to allocate the main execution call
    uint256 verificationGasLimit; // The amount of gas to allocate for the verification step
    uint256 preVerificationGas; // Extra gas to pay the bunder
    uint256 maxFeePerGas; // Maximum fee per gas (similar to EIP-1559 max_fee_per_gas)
    uint256 maxPriorityFeePerGas; // Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas)
    address paymaster; // Address of paymaster contract, (or empty, if account pays for itself)
    uint256 paymasterVerificationGasLimit; // The amount of gas to allocate for the paymaster validation code
    uint256 paymasterPostOpGasLimit; // The amount of gas to allocate for the paymaster post-operation code
    bytes paymasterData; // Data for paymaster (only if paymaster exists)
    bytes signature; // Data passed into the account to verify authorization
}
*/

struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode; // concatenation of factory address and factoryData (or empty)
    bytes callData;
    bytes32 accountGasLimits; // concatenation of verificationGas (16 bytes) and callGas (16 bytes)
    uint256 preVerificationGas;
    bytes32 gasFees; // concatenation of maxPriorityFee (16 bytes) and maxFeePerGas (16 bytes)
    bytes paymasterAndData; // concatenation of paymaster fields (or empty)
    bytes signature;
}

interface IAggregator {
    function validateSignatures(PackedUserOperation[] calldata userOps, bytes calldata signature) external view;

    function validateUserOpSignature(
        PackedUserOperation calldata userOp
    ) external view returns (bytes memory sigForUserOp);

    function aggregateSignatures(
        PackedUserOperation[] calldata userOps
    ) external view returns (bytes memory aggregatesSignature);
}

interface IEntryPointNonces {
    function getNonce(address sender, uint192 key) external view returns (uint256 nonce);
}

interface IEntryPointStake {
    function balanceOf(address account) external view returns (uint256);

    function depositTo(address account) external payable;

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;

    function addStake(uint32 unstakeDelaySec) external payable;

    function unlockStake() external;

    function withdrawStake(address payable withdrawAddress) external;
}

interface IEntryPoint is IEntryPointNonces, IEntryPointStake {
    error FailedOp(uint256 opIndex, string reason);
    error FailedOpWithRevert(uint256 opIndex, string reason, bytes inner);

    struct UserOpsPerAggregator {
        PackedUserOperation[] userOps;
        IAggregator aggregator;
        bytes signature;
    }

    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external;

    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;
}

// TODO: EntryPointSimulation

interface IAccount {
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

interface IAccountExecute {
    function executeUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) external;
}

interface IPaymaster {
    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}
