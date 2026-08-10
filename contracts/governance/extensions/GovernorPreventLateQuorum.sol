// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (governance/extensions/GovernorPreventLateQuorum.sol)

pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";
import {Math} from "../../utils/math/Math.sol";

/**
 * @dev A module that ensures there is a minimum voting period after quorum is reached. This prevents a large voter from
 * swaying a vote and triggering quorum at the last minute, by ensuring there is always time for other voters to react
 * and try to oppose the decision.
 *
 * If a vote causes quorum to be reached, the proposal's voting period may be extended so that it does not end before at
 * least a specified time has passed (the "vote extension" parameter). This parameter can be set through a governance
 * proposal.
 */
abstract contract GovernorPreventLateQuorum is Governor {
    uint48 private _voteExtension;

    mapping(uint256 proposalId => uint48) private _extendedDeadlines;

    /// @dev Emitted when a proposal deadline is pushed back due to reaching quorum late in its voting period.
    event ProposalExtended(uint256 indexed proposalId, uint64 extendedDeadline);

    /// @dev Emitted when the {lateQuorumVoteExtension} parameter is changed.
    event LateQuorumVoteExtensionSet(uint64 oldVoteExtension, uint64 newVoteExtension);

    /// @dev Thrown when the {lateQuorumVoteExtension} parameter is set to a value larger than {_maxLateQuorumVoteExtension}.
    error GovernorPreventLateQuorumVoteExtensionTooLarge(uint256 newVoteExtension, uint256 maxVoteExtension);

    /**
     * @dev Initializes the vote extension parameter: the time in either number of blocks or seconds (depending on the
     * governor clock mode) that is required to pass since the moment a proposal reaches quorum until its voting period
     * ends. If necessary the voting period will be extended beyond the one set during proposal creation.
     */
    constructor(uint48 initialVoteExtension) {
        _setLateQuorumVoteExtension(initialVoteExtension);
    }

    /**
     * @dev Returns the proposal deadline, which may have been extended beyond that set at proposal creation, if the
     * proposal reached quorum late in the voting period. See {Governor-proposalDeadline}.
     */
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        return Math.max(super.proposalDeadline(proposalId), _extendedDeadlines[proposalId]);
    }

    /**
     * @dev Vote tally updated and detects if it caused quorum to be reached, potentially extending the voting period.
     *
     * The extended deadline is computed as `clock() + lateQuorumVoteExtension()`. Since {lateQuorumVoteExtension}
     * is bounded by {_maxLateQuorumVoteExtension} when set, this addition cannot overflow in practice and brick
     * governance mid-vote.
     *
     * May emit a {ProposalExtended} event.
     */
    function _tallyUpdated(uint256 proposalId) internal virtual override {
        super._tallyUpdated(proposalId);
        if (_extendedDeadlines[proposalId] == 0 && _quorumReached(proposalId)) {
            uint48 extendedDeadline = clock() + lateQuorumVoteExtension();

            if (extendedDeadline > proposalDeadline(proposalId)) {
                emit ProposalExtended(proposalId, extendedDeadline);
            }

            _extendedDeadlines[proposalId] = extendedDeadline;
        }
    }

    /**
     * @dev Returns the current value of the vote extension parameter: the number of blocks that are required to pass
     * from the time a proposal reaches quorum until its voting period ends.
     */
    function lateQuorumVoteExtension() public view virtual returns (uint48) {
        return _voteExtension;
    }

    /**
     * @dev Upper bound applied to {lateQuorumVoteExtension} when it is set. Defaults to the voting period,
     * resulting in a total maximum voting period of twice the governor's documented voting period.
     * Can be overridden to provide a different upper bound.
     *
     * NOTE: {_tallyUpdated} adds `lateQuorumVoteExtension()` to `clock()` using `uint48` arithmetic, which is
     * safe under the default bound. Overriding this to a value close to (or greater than) `type(uint48).max`
     * can make that addition overflow and revert the quorum-reaching vote, bricking governance.
     */
    function _maxLateQuorumVoteExtension() internal view virtual returns (uint256) {
        return votingPeriod();
    }

    /**
     * @dev Changes the {lateQuorumVoteExtension}. This operation can only be performed by the governance executor,
     * generally through a governance proposal.
     *
     * Emits a {LateQuorumVoteExtensionSet} event.
     */
    function setLateQuorumVoteExtension(uint48 newVoteExtension) public virtual onlyGovernance {
        _setLateQuorumVoteExtension(newVoteExtension);
    }

    /**
     * @dev Changes the {lateQuorumVoteExtension}. This is an internal function that can be exposed in a public function
     * like {setLateQuorumVoteExtension} if another access control mechanism is needed.
     *
     * Emits a {LateQuorumVoteExtensionSet} event.
     */
    function _setLateQuorumVoteExtension(uint48 newVoteExtension) internal virtual {
        uint256 maxVoteExtension = _maxLateQuorumVoteExtension();
        if (newVoteExtension > maxVoteExtension) {
            revert GovernorPreventLateQuorumVoteExtensionTooLarge(newVoteExtension, maxVoteExtension);
        }
        emit LateQuorumVoteExtensionSet(_voteExtension, newVoteExtension);
        _voteExtension = newVoteExtension;
    }
}
