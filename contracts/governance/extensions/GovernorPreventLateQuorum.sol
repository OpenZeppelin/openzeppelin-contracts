// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (governance/extensions/GovernorPreventLateQuorum.sol)

pragma solidity ^0.8.31;

import {Math} from "../../utils/math/Math.sol";
import {Governor} from "../Governor.sol";

/**
 * @dev A module that ensures there is a minimum voting period after quorum is reached. This prevents a large voter from
 * swaying a vote and triggering quorum at the last minute, by ensuring there is always time for other voters to react
 * and try to oppose the decision.
 *
 * If a vote causes quorum to be reached, the proposal's voting period may be extended so that it does not end before at
 * least a specified time has passed (the "vote extension" parameter). This parameter can be set through a governance
 * proposal.
 *
 * NOTE: This module only reacts to the first time a proposal reaches quorum. If quorum can later be lost, for example
 * when combined with {GovernorCountingOverridable}, reaching quorum again will not trigger another vote extension.
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
     * The extended deadline is computed as `clock() + lateQuorumVoteExtension()`, with the extension capped by
     * {_maxLateQuorumVoteExtension}. Since the cap is applied here, and not only when the extension is set, this
     * addition cannot overflow in practice and brick governance mid-vote, even if the bound was not known when the
     * extension was set or has decreased since.
     *
     * May emit a {ProposalExtended} event.
     */
    function _tallyUpdated(uint256 proposalId) internal virtual override {
        super._tallyUpdated(proposalId);
        if (_extendedDeadlines[proposalId] == 0 && _quorumReached(proposalId)) {
            // Downcast is safe: the minimum is at most `lateQuorumVoteExtension()`, which is a uint48.
            uint48 voteExtension = uint48(Math.min(lateQuorumVoteExtension(), _maxLateQuorumVoteExtension()));
            uint48 extendedDeadline = clock() + voteExtension;

            if (extendedDeadline > proposalDeadline(proposalId)) {
                emit ProposalExtended(proposalId, extendedDeadline);
            }

            _extendedDeadlines[proposalId] = extendedDeadline;
        }
    }

    /**
     * @dev Returns the current value of the vote extension parameter: the number of blocks that are required to pass
     * from the time a proposal reaches quorum until its voting period ends.
     *
     * NOTE: The extension applied to a proposal is capped by {_maxLateQuorumVoteExtension}, so it can be shorter than
     * this value (e.g. if the voting period was lowered after this value was set).
     */
    function lateQuorumVoteExtension() public view virtual returns (uint48) {
        return _voteExtension;
    }

    /**
     * @dev Upper bound applied to {lateQuorumVoteExtension} when it is set, and when it is used to extend a proposal's
     * deadline. Defaults to the voting period, resulting in a total maximum voting period of twice the governor's
     * documented voting period. Can be overridden to provide a different upper bound.
     *
     * A bound of zero is treated as not yet known when the extension is set, and the check is skipped. This happens
     * in the constructor when the voting period is set by a module constructed later (e.g. {GovernorSettings} listed
     * after this contract), or read from an immutable assigned in the derived contract's constructor. The bound is
     * still applied when the extension is used.
     *
     * NOTE: {_tallyUpdated} adds the capped extension to `clock()` using `uint48` arithmetic, which is safe under the
     * default bound. Overriding this to a value close to (or greater than) `type(uint48).max` can make that addition
     * overflow and revert the quorum-reaching vote, bricking governance.
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
        // A zero bound is not known yet (see {_maxLateQuorumVoteExtension}). {_tallyUpdated} applies it once it is.
        require(
            maxVoteExtension == 0 || newVoteExtension <= maxVoteExtension,
            GovernorPreventLateQuorumVoteExtensionTooLarge(newVoteExtension, maxVoteExtension)
        );
        emit LateQuorumVoteExtensionSet(_voteExtension, newVoteExtension);
        _voteExtension = newVoteExtension;
    }
}
