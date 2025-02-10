// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Interface to count votes for the following counting modules:
 * - GovernorCountingFractional
 * - GovernorCountingSimple
 * - GovernorCountingOverridable
 *
 * This interface is used by GovernorSuperQuorum to get counted votes from the above counting modules.
 * Other counting modules that need to work with GovernorSuperQuorum MUST implement this interface.
 */
interface IGovernorCounting {
    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(
        uint256 proposalId
    ) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes);
}
