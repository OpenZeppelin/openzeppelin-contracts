// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.5;

import "./PackedUserOperation.sol";

/**
 * Aggregated Signatures validator.
 */
interface IAggregator {
    /**
     * Validate aggregated signature.
     * Revert if the aggregated signature does not match the given list of operations.
     * @param userOps   - Array of UserOperations to validate the signature for.
     * @param signature - The aggregated signature.
     */
    function validateSignatures(
        PackedUserOperation[] calldata userOps,
        bytes calldata signature
    ) external view;

    /**
     * Validate signature of a single userOp.
     * This method should be called by bundler after EntryPointSimulation.simulateValidation() returns
     * the aggregator this account uses.
     * First it validates the signature over the userOp. Then it returns data to be used when creating the handleOps.
     * @param userOp        - The userOperation received from the user.
     * @return sigForUserOp - The value to put into the signature field of the userOp when calling handleOps.
     *                        (usually empty, unless account and aggregator support some kind of "multisig".
     */
    function validateUserOpSignature(
        PackedUserOperation calldata userOp
    ) external view returns (bytes memory sigForUserOp);

    /**
     * Aggregate multiple signatures into a single value.
     * This method is called off-chain to calculate the signature to pass with handleOps()
     * bundler MAY use optimized custom code perform this aggregation.
     * @param userOps              - Array of UserOperations to collect the signatures from.
     * @return aggregatedSignature - The aggregated signature.
     */
    function aggregateSignatures(
        PackedUserOperation[] calldata userOps
    ) external view returns (bytes memory aggregatedSignature);
}
