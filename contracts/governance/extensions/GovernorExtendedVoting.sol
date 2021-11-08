// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts vX.X.X (governance/extensions/GovernorExtendedVoting.sol)

pragma solidity ^0.8.0;

import "../Governor.sol";

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

    event VotingDelayExtentionSet(uint64 oldVotingDelayExtention, uint64 newVotingDelayExtention);

    /**
     * @dev Initialize the delay extension.
     */
    constructor(uint64 initialVotingDelayExtention) {
        _setVotingDelayExtention(initialVotingDelayExtention);
    }

    /**
     * @dev Overriden version of the {Governor-state} function.
     */
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        ProposalState status = super.state(proposalId);

        if ((status == ProposalState.Defeated || status == ProposalState.Succeeded) && _extendedVoteEnd[proposalId].getDeadline() >= block.number) {
            return ProposalState.Active;
        }

        return status;
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
                extension.setDeadline(block.number.toUint64() + votingDelayExtention());
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
