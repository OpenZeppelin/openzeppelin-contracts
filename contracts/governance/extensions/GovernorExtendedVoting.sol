// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts vX.X.X (governance/extensions/GovernorExtendedVoting.sol)

pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for extending voting past quorum being reached.
 *
 * _Available since v4.X._
 */
abstract contract GovernorExtendedVoting is Governor {
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;

    uint64 private _votingDelayExtension;
    mapping(uint256 => Timers.BlockNumber) private _extendedVoteEnd;

    event ProposalExtended(uint256 indexed proposalId, uint64 extendedDeadline);
    event VotingDelayExtentionSet(uint64 oldVotingDelayExtention, uint64 newVotingDelayExtention);

    /**
     * @dev Initialize the delay extension.
     */
    constructor(uint64 initialVotingDelayExtention) {
        _setVotingDelayExtention(initialVotingDelayExtention);
    }

    /**
     * @dev Overriden version of the {Governor-proposalDeadline} function to consider extended deadlines.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return Math.max(super.proposalDeadline(proposalId), _extendedVoteEnd[proposalId].getDeadline());
    }

    /**
     * @dev Overriden version of the {Governor-_castVote} function.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual override returns (uint256) {
        uint256 result = super._castVote(proposalId, account, support, reason);

        if (_quorumReached(proposalId)) {
            Timers.BlockNumber storage extension = _extendedVoteEnd[proposalId];

            if (extension.isUnset()) {
                uint64 extendedDeadline = block.number.toUint64() + votingDelayExtention();

                if (extendedDeadline > proposalDeadline(proposalId)) {
                    emit ProposalExtended(proposalId, extendedDeadline);
                }

                extension.setDeadline(extendedDeadline);
            }
        }

        return result;
    }

    /**
     * @dev Public accessor for the voting delay extension duration.
     */
    function votingDelayExtention() public view virtual returns (uint64) {
        return _votingDelayExtension;
    }

    /**
     * @dev Update the voting delay extension duration. This operation can only be performed through a governance proposal.
     *
     * Emits a {VotingDelayExtentionSet} event.
     */
    function setVotingDelayExtention(uint64 newVotingDelayExtention) public onlyGovernance {
        _setVotingDelayExtention(newVotingDelayExtention);
    }

    /**
     * @dev Internal setter for the voting delay extension duration.
     *
     * Emits a {VotingDelayExtentionSet} event.
     */
    function _setVotingDelayExtention(uint64 newVotingDelayExtention) internal virtual {
        emit VotingDelayExtentionSet(_votingDelayExtension, newVotingDelayExtention);
        _votingDelayExtension = newVotingDelayExtention;
    }
}
