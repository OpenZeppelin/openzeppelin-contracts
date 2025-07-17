// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorSuperQuorum.sol)
pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} with a super quorum. Proposals that meet the super quorum (and have a majority of for
 * votes) advance to the `Succeeded` state before the proposal deadline. Counting modules that want to use this
 * extension must implement {proposalVotes}.
 */
abstract contract GovernorSuperQuorum is Governor {
    /**
     * @dev Minimum number of cast votes required for a proposal to reach super quorum. Only FOR votes are counted
     * towards the super quorum. Once the super quorum is reached, an active proposal can proceed to the next state
     * without waiting for the proposal deadline.
     *
     * NOTE: The `timepoint` parameter corresponds to the snapshot used for counting the vote. This enables scaling of the
     * quorum depending on values such as the `totalSupply` of a token at this timepoint (see {ERC20Votes}).
     *
     * NOTE: Make sure the value specified for the super quorum is greater than {quorum}, otherwise, it may be
     * possible to pass a proposal with less votes than the default quorum.
     */
    function superQuorum(uint256 timepoint) public view virtual returns (uint256);

    /**
     * @dev Accessor to the internal vote counts. This must be implemented by the counting module. Counting modules
     * that don't implement this function are incompatible with this module
     */
    function proposalVotes(
        uint256 proposalId
    ) public view virtual returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes);

    /**
     * @dev Overridden version of the {Governor-state} function that checks if the proposal has reached the super
     * quorum.
     *
     * NOTE: If the proposal reaches super quorum but {_voteSucceeded} returns false, eg, assuming the super quorum
     * has been set low enough that both FOR and AGAINST votes have exceeded it and AGAINST votes exceed FOR votes,
     * the proposal continues to be active until {_voteSucceeded} returns true or the proposal deadline is reached.
     * This means that with a low super quorum it is also possible that a vote can succeed prematurely before enough
     * AGAINST voters have a chance to vote. Hence, it is recommended to set a high enough super quorum to avoid these
     * types of scenarios.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);
        if (currentState != ProposalState.Active) return currentState;

        (, uint256 forVotes, ) = proposalVotes(proposalId);
        if (forVotes < superQuorum(proposalSnapshot(proposalId)) || !_voteSucceeded(proposalId)) {
            return ProposalState.Active;
        } else if (proposalEta(proposalId) == 0) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Queued;
        }
    }
}
