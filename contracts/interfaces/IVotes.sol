// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (interfaces/IVotes.sol)
pragma solidity ^0.8.0;

/**
 * @dev Interface of the Votes standard.
 *
 * _Available since v4.4._
 */
interface IVotes {
    /**
     * @dev Returns total amount of votes for account.
     */
    function getVotes(address account) external view returns (uint256);

    /**
     * @dev Returns total amount of votes at given blockNumber.
     */
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);

    /**
     * @dev Retrieve the `totalVotingPower` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) external;

    /**
     * @dev Returns account delegation.
     */
    function delegates(address account) external view returns (address);

    /**
     * @dev Delegates votes from signer to `delegatee`
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
