// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {GovernorSuperQuorum} from "./GovernorSuperQuorum.sol";
import {GovernorVotesQuorumFraction} from "./GovernorVotesQuorumFraction.sol";
import {Math} from "../../utils/math/Math.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Checkpoints} from "../../utils/structs/Checkpoints.sol";

/**
 * @dev Extension of {GovernorVotesQuorumFraction} with a super quorum expressed as a
 * fraction of the total supply. Proposals that meet the super quorum (and have a majority of for votes) advance to
 * the `Succeeded` state before the proposal deadline.
 */
abstract contract GovernorVotesSuperQuorumFraction is GovernorVotesQuorumFraction, GovernorSuperQuorum {
    using Checkpoints for Checkpoints.Trace208;

    Checkpoints.Trace208 private _superQuorumNumeratorHistory;

    event SuperQuorumNumeratorUpdated(uint256 oldSuperQuorumNumerator, uint256 newSuperQuorumNumerator);

    /**
     * @dev The super quorum set is not valid as it exceeds the quorum denominator.
     */
    error GovernorInvalidSuperQuorumFraction(uint256 superQuorumNumerator, uint256 denominator);

    /**
     * @dev The super quorum set is not valid as it is smaller or equal to the quorum.
     */
    error GovernorInvalidSuperQuorumTooSmall(uint256 superQuorumNumerator, uint256 quorumNumerator);

    /**
     * @dev The quorum set is not valid as it exceeds the super quorum.
     */
    error GovernorInvalidQuorumTooLarge(uint256 quorumNumerator, uint256 superQuorumNumerator);

    /**
     * @dev Initialize super quorum as a fraction of the token's total supply.
     *
     * The super quorum is specified as a fraction of the token's total supply and has to
     * be greater than the quorum.
     */
    constructor(uint256 superQuorumNumeratorValue) {
        _updateSuperQuorumNumerator(superQuorumNumeratorValue);
    }

    /**
     * @dev Returns the current super quorum numerator.
     */
    function superQuorumNumerator() public view virtual returns (uint256) {
        return _superQuorumNumeratorHistory.latest();
    }

    /**
     * @dev Returns the super quorum numerator at a specific `timepoint`.
     */
    function superQuorumNumerator(uint256 timepoint) public view virtual returns (uint256) {
        return _optimisticUpperLookupRecent(_superQuorumNumeratorHistory, timepoint);
    }

    /**
     * @dev Returns the super quorum for a `timepoint`, in terms of number of votes: `supply * numerator / denominator`.
     */
    function superQuorum(uint256 timepoint) public view virtual override returns (uint256) {
        return Math.mulDiv(token().getPastTotalSupply(timepoint), superQuorumNumerator(timepoint), quorumDenominator());
    }

    /**
     * @dev Changes the super quorum numerator.
     *
     * Emits a {SuperQuorumNumeratorUpdated} event.
     *
     * Requirements:
     *
     * - Must be called through a governance proposal.
     * - New super quorum numerator must be smaller or equal to the denominator.
     * - New super quorum numerator must be greater than or equal to the quorum numerator.
     */
    function updateSuperQuorumNumerator(uint256 newSuperQuorumNumerator) public virtual onlyGovernance {
        _updateSuperQuorumNumerator(newSuperQuorumNumerator);
    }

    /**
     * @dev Changes the super quorum numerator.
     *
     * Emits a {SuperQuorumNumeratorUpdated} event.
     *
     * Requirements:
     *
     * - New super quorum numerator must be smaller or equal to the denominator.
     * - New super quorum numerator must be greater than or equal to the quorum numerator.
     */
    function _updateSuperQuorumNumerator(uint256 newSuperQuorumNumerator) internal virtual {
        uint256 denominator = quorumDenominator();
        if (newSuperQuorumNumerator > denominator) {
            revert GovernorInvalidSuperQuorumFraction(newSuperQuorumNumerator, denominator);
        }

        uint256 quorumNumerator = quorumNumerator();
        if (newSuperQuorumNumerator < quorumNumerator) {
            revert GovernorInvalidSuperQuorumTooSmall(newSuperQuorumNumerator, quorumNumerator);
        }

        uint256 oldSuperQuorumNumerator = _superQuorumNumeratorHistory.latest();
        _superQuorumNumeratorHistory.push(clock(), SafeCast.toUint208(newSuperQuorumNumerator));

        emit SuperQuorumNumeratorUpdated(oldSuperQuorumNumerator, newSuperQuorumNumerator);
    }

    /**
     * @dev Overrides {GovernorVotesQuorumFraction-_updateQuorumNumerator} to ensure the super
     * quorum numerator is greater than or equal to the quorum numerator.
     */
    function _updateQuorumNumerator(uint256 newQuorumNumerator) internal virtual override {
        // Ignoring check when the superQuorum was never set (construction sets quorum before superQuorum)
        if (_superQuorumNumeratorHistory.length() > 0) {
            uint256 superQuorumNumerator_ = superQuorumNumerator();
            if (newQuorumNumerator > superQuorumNumerator_) {
                revert GovernorInvalidQuorumTooLarge(newQuorumNumerator, superQuorumNumerator_);
            }
        }
        super._updateQuorumNumerator(newQuorumNumerator);
    }

    /// @inheritdoc GovernorSuperQuorum
    function state(
        uint256 proposalId
    ) public view virtual override(Governor, GovernorSuperQuorum) returns (ProposalState) {
        return super.state(proposalId);
    }
}
