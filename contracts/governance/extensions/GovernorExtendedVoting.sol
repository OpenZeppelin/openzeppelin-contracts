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
    event VotingDelayExtensionSet(uint64 oldVotingDelayExtension, uint64 newVotingDelayExtension);

    /**
     * @dev Initialize the delay extension.
     */
    constructor(uint64 initialVotingDelayExtension) {
        _setVotingDelayExtension(initialVotingDelayExtension);
    }

    /**
     * @dev Overriden version of the {Governor-proposalDeadline} function to consider extended deadlines.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return Math.max(super.proposalDeadline(proposalId), _extendedVoteEnd[proposalId].getDeadline());
    }

    /**
     * @dev Overriden version of the {Governor-_castVote} function.
     *
     * Might emit a {ProposalExtended} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal virtual override returns (uint256) {
        uint256 result = super._castVote(proposalId, account, support, reason);

        Timers.BlockNumber storage extension = _extendedVoteEnd[proposalId];

        if (extension.isUnset() && _quorumReached(proposalId)) {
            uint64 extendedDeadline = block.number.toUint64() + votingDelayExtension();

            if (extendedDeadline > proposalDeadline(proposalId)) {
                emit ProposalExtended(proposalId, extendedDeadline);
            }

            extension.setDeadline(extendedDeadline);
        }

        return result;
    }

    /**
     * @dev Public accessor for the voting delay extension duration.
     */
    function votingDelayExtension() public view virtual returns (uint64) {
        return _votingDelayExtension;
    }

    /**
     * @dev Update the voting delay extension duration. This operation can only be performed through a governance proposal.
     *
     * Emits a {VotingDelayExtensionSet} event.
     */
    function setVotingDelayExtension(uint64 newVotingDelayExtension) public onlyGovernance {
        _setVotingDelayExtension(newVotingDelayExtension);
    }

    /**
     * @dev Internal setter for the voting delay extension duration.
     *
     * Emits a {VotingDelayExtensionSet} event.
     */
    function _setVotingDelayExtension(uint64 newVotingDelayExtension) internal virtual {
        emit VotingDelayExtensionSet(_votingDelayExtension, newVotingDelayExtension);
        _votingDelayExtension = newVotingDelayExtension;
    }
}
