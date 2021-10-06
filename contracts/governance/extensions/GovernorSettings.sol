// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Governor.sol";

/**
 * @dev Extension of {Governor} for settings updatable through governance.
 *
 * _Available since v4.4._
 */
abstract contract GovernorSettings is Governor {
    uint256 private _votingDelay;
    uint256 private _votingPeriod;
    uint256 private _proposalThreshold;

    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);

    constructor(
        uint256 initialVotingDelay,
        uint256 initialVotingPeriod,
        uint256 initialProposalThreshold
    ) {
        _setVotingDelay(initialVotingDelay);
        _setVotingPeriod(initialVotingPeriod);
        _setProposalThreshold(initialProposalThreshold);
    }

    function votingDelay() public view virtual override returns (uint256) {
        return _votingDelay;
    }

    function votingPeriod() public view virtual override returns (uint256) {
        return _votingPeriod;
    }

    function proposalThreshold() public view virtual override returns (uint256) {
        return _proposalThreshold;
    }

    function setVotingDelay(uint256 newVotingDelay) public onlyGovernance {
        _setVotingDelay(newVotingDelay);
    }

    function setVotingPeriod(uint256 newVotingPeriod) public onlyGovernance {
        _setVotingPeriod(newVotingPeriod);
    }

    function setProposalThreshold(uint256 newProposalThreshold) public onlyGovernance {
        _setProposalThreshold(newProposalThreshold);
    }

    function _setVotingDelay(uint256 newVotingDelay) internal virtual {
        uint256 oldVotingDelay = _votingDelay;
        _votingDelay = newVotingDelay;
        emit VotingDelaySet(oldVotingDelay, newVotingDelay);
    }

    function _setVotingPeriod(uint256 newVotingPeriod) internal virtual {
        // voting period must be at least one block long
        require(newVotingPeriod > 0, "GovernorSettings: value too low");
        uint256 oldVotingPeriod = _votingPeriod;
        _votingPeriod = newVotingPeriod;
        emit VotingPeriodSet(oldVotingPeriod, newVotingPeriod);
    }

    function _setProposalThreshold(uint256 newProposalThreshold) internal virtual {
        uint256 oldProposalThreshold = _proposalThreshold;
        _proposalThreshold = newProposalThreshold;
        emit ProposalThresholdSet(oldProposalThreshold, newProposalThreshold);
    }
}
