// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} which adds a proposal guardian that can cancel proposals at any stage of their lifecycle.
 *
 * NOTE: if the proposal guardian is not configured, then proposers take this role for their proposals.
 */
abstract contract GovernorProposalGuardian is Governor {
    address private _proposalGuardian;

    event ProposalGuardianSet(address oldProposalGuardian, address newProposalGuardian);

    /**
     * @dev Override `_validateCancel` that implements the extended cancellation logic.
     *
     * * The {proposalGuardian} can cancel any proposal at any point in the lifecycle.
     * * if no proposal guardian is set, the {proposalProposer} can cancel their proposals at any point in the lifecycle.
     * * if the proposal guardian is set, the {proposalProposer} keeps their default rights defined in {IGovernor-_validateCancel} (calling `super`).
     */
    function _validateCancel(uint256 proposalId, address caller) internal view virtual override returns (bool) {
        address guardian = proposalGuardian();

        if (guardian == address(0)) {
            // if there is no proposal guardian
            // ... only the proposer can cancel
            // ... no restriction on when the proposer can cancel
            address proposer = proposalProposer(proposalId);
            if (caller == proposer) return true;
        } else if (guardian == caller) {
            // if there is a proposal guardian, and the caller is the proposal guardian
            // ... just cancel
            return true;
        }

        // if there is no guardian and the caller isn't the proposer or
        // there is a proposal guardian, and the caller is not the proposal guardian
        // ... apply default behavior
        return super._validateCancel(proposalId, caller);
    }

    /**
     * @dev Getter that returns the address of the proposal guardian.
     */
    function proposalGuardian() public view virtual returns (address) {
        return _proposalGuardian;
    }

    /**
     * @dev Update the proposal guardian's address. This operation can only be performed through a governance proposal.
     *
     * Emits a {ProposalGuardianSet} event.
     */
    function setProposalGuardian(address newProposalGuardian) public virtual onlyGovernance {
        _setProposalGuardian(newProposalGuardian);
    }

    /**
     * @dev Internal setter for the proposal guardian.
     *
     * Emits a {ProposalGuardianSet} event.
     */
    function _setProposalGuardian(address newProposalGuardian) internal virtual {
        emit ProposalGuardianSet(_proposalGuardian, newProposalGuardian);
        _proposalGuardian = newProposalGuardian;
    }
}
