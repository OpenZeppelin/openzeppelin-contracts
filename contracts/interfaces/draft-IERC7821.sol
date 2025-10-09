// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC7821.sol)

pragma solidity >=0.5.0;

/**
 * @dev Interface for minimal batch executor.
 */
interface IERC7821 {
    /**
     * @dev Executes the calls in `executionData`.
     * Reverts and bubbles up error if any call fails.
     *
     * `executionData` encoding:
     * - If `opData` is empty, `executionData` is simply `abi.encode(calls)`.
     * - Else, `executionData` is `abi.encode(calls, opData)`.
     *   See: https://eips.ethereum.org/EIPS/eip-7579
     *
     * Supported modes:
     * - `bytes32(0x01000000000000000000...)`: does not support optional `opData`.
     * - `bytes32(0x01000000000078210001...)`: supports optional `opData`.
     *
     * Authorization checks:
     * - If `opData` is empty, the implementation SHOULD require that
     *   `msg.sender == address(this)`.
     * - If `opData` is not empty, the implementation SHOULD use the signature
     *   encoded in `opData` to determine if the caller can perform the execution.
     *
     * `opData` may be used to store additional data for authentication,
     * paymaster data, gas limits, etc.
     *
     * For calldata compression efficiency, if a Call.to is `address(0)`,
     * it will be replaced with `address(this)`.
     */
    function execute(bytes32 mode, bytes calldata executionData) external payable;

    /**
     * @dev This function is provided for frontends to detect support.
     * Only returns true for:
     * - `bytes32(0x01000000000000000000...)`: does not support optional `opData`.
     * - `bytes32(0x01000000000078210001...)`: supports optional `opData`.
     */
    function supportsExecutionMode(bytes32 mode) external view returns (bool);
}
