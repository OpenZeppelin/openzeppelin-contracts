// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorProposalGuardian.sol)

pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} which adds a proposal guardian that can cancel proposals at any stage in the proposal's lifecycle.
 *
 * NOTE: if the proposal guardian is not configured, then proposers take this role for their proposals.
 */
abstract contract GovernorProposalGuardian is Governor {
    address private _proposalGuardian;

    event ProposalGuardianSet(address oldProposalGuardian, address newProposalGuardian);

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

    /**
     * @dev Override {Governor-_validateCancel} to implement the extended cancellation logic.
     *
     * * The {proposalGuardian} can cancel any proposal at any point.
     * * If no proposal guardian is set, the {IGovernor-proposalProposer} can cancel their proposals at any point.
     * * In any case, permissions defined in {Governor-_validateCancel} (or another override) remains valid.
     */
    function _validateCancel(uint256 proposalId, address caller) internal view virtual override returns (bool) {
        address guardian = proposalGuardian();

        return
            guardian == caller ||
            (guardian == address(0) && caller == proposalProposer(proposalId)) ||
            super._validateCancel(proposalId, caller);
    }
}
