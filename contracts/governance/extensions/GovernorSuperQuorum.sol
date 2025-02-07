// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Checkpoints} from "../../utils/structs/Checkpoints.sol";

/**
 * @dev Extension of {Governor} with a super quorum. Proposals that meet the super quorum can be executed
 * earlier than the proposal deadline.
 *
 * NOTE: It's up to developers to implement `superQuorum` and validate it against `quorum`.
 */
abstract contract GovernorSuperQuorum is Governor {
    /**
     * @dev Minimum number of cast votes required for a proposal to reach super quorum. Only FOR votes are counted towards
     * the super quorum. Once the super quorum is reached, an active proposal can proceed to the next state without waiting
     * for the proposal deadline.
     *
     * NOTE: The `timepoint` parameter corresponds to the snapshot used for counting vote. This allows to scale the
     * quorum depending on values such as the totalSupply of a token at this timepoint (see {ERC20Votes}).
     */
    function superQuorum(uint256 timepoint) public view virtual returns (uint256);

    /**
     * @dev Overridden version of the {Governor-state} function that checks if the proposal has reached the super quorum.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState currentState = super.state(proposalId);
        if (currentState != ProposalState.Active) return currentState;

        (, uint256 forVotes, ) = proposalVotes(proposalId);
        bool superQuorumReached = forVotes >= superQuorum(proposalSnapshot(proposalId));
        if (!superQuorumReached) {
            return currentState;
        }

        if (!_voteSucceeded(proposalId)) {
            return ProposalState.Defeated;
        } else if (proposalEta(proposalId) == 0) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Queued;
        }
    }
}
