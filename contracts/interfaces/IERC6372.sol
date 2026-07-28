// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC6372.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface for the Contract Clock standard.
 *
 * A standardized interface for a contract to expose the clock it uses internally, so that an external observer can
 * tell whether it tracks time using block numbers, timestamps, or some other mode, instead of assuming one.
 */
interface IERC6372 {
    /**
     * @dev Returns the current timepoint according to the mode the contract is operating on.
     * This is a non-decreasing function of the chain, such as `block.timestamp` or `block.number`.
     *
     * NOTE: Clock must not return 0.
     */
    function clock() external view returns (uint48);

    /**
     * @dev Returns a machine-readable description of the clock, formatted as a URL query string.
     * Timestamps are described as `mode=timestamp` and block numbers as `mode=blocknumber&from=default`,
     * where `default` becomes a CAIP-2 chain ID (e.g. `eip155:1`) if the block number is not that of the
     * `NUMBER` opcode. Any other mode uses a unique identifier for the `mode` field.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() external view returns (string memory);
}
