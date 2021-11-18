// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts vX.X.X (governance/extensions/GovernorVoteExtension.sol)

pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for extending voting past quorum being reached.
 *
 * _Available since v4.X._
 */
abstract contract GovernorVoteExtension is Governor {
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;

    uint64 private _voteExtensionDuration;
    mapping(uint256 => Timers.BlockNumber) private _extendedDeadlines;

    event ProposalExtended(uint256 indexed proposalId, uint64 extendedDeadline);
    event VoteExtensionSet(uint64 oldVoteExtension, uint64 newVoteExtension);

    /**
     * @dev Initialize the delay extension.
     */
    constructor(uint64 initialVoteExtension) {
        _setVoteExtension(initialVoteExtension);
    }

    /**
     * @dev Overriden version of the {Governor-proposalDeadline} function to consider extended deadlines.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return Math.max(super.proposalDeadline(proposalId), _extendedDeadlines[proposalId].getDeadline());
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

        Timers.BlockNumber storage extendedDeadline = _extendedDeadlines[proposalId];

        if (extendedDeadline.isUnset() && _quorumReached(proposalId)) {
            uint64 extendedDeadlineValue = block.number.toUint64() + voteExtension();

            if (extendedDeadlineValue > proposalDeadline(proposalId)) {
                emit ProposalExtended(proposalId, extendedDeadlineValue);
            }

            extendedDeadline.setDeadline(extendedDeadlineValue);
        }

        return result;
    }

    /**
     * @dev Public accessor for the voting delay extension duration.
     */
    function voteExtension() public view virtual returns (uint64) {
        return _voteExtensionDuration;
    }

    /**
     * @dev Update the voting delay extension duration. This operation can only be performed through a governance proposal.
     *
     * Emits a {VoteExtensionSet} event.
     */
    function setVoteExtension(uint64 newVoteExtension) public virtual onlyGovernance {
        _setVoteExtension(newVoteExtension);
    }

    /**
     * @dev Internal setter for the voting delay extension duration.
     *
     * Emits a {VoteExtensionSet} event.
     */
    function _setVoteExtension(uint64 newVoteExtension) internal virtual {
        emit VoteExtensionSet(_voteExtensionDuration, newVoteExtension);
        _voteExtensionDuration = newVoteExtension;
    }
}
