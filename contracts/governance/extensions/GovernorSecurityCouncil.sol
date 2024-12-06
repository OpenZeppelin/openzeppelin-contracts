// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} for adds a security council that can cancel proposals at any stage of their lifecycle.
 *
 * Note: if the council is not configure, then proposers take over the
 */
abstract contract GovernorSecurityCouncil is Governor {
    address private _council;

    event CouncilSet(address oldCouncil, address newCouncil);

    /**
     * @dev Override {IGovernor-cancel} that implements the extended cancellation logic.
     * * council can cancel any proposal at any point in the lifecycle.
     * * if no council is set, proposer can cancel their proposals at any point in the lifecycle.
     * * if the council is set, proposer keep their ability to cancel during the pending stage (default behavior).
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual override returns (uint256) {
        address caller = _msgSender();
        address authority = council();

        if (authority == address(0)) {
            // if there is no council
            // ... only the proposer can cancel
            // ... no restriction on when the proposer can cancel
            uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
            address proposer = proposalProposer(proposalId);
            if (caller != proposer) revert GovernorOnlyProposer(caller);
            return _cancel(targets, values, calldatas, descriptionHash);
        } else if (authority == caller) {
            // if there is a council, and the caller is the council
            // ... just cancel
            return _cancel(targets, values, calldatas, descriptionHash);
        } else {
            // if there is a council, and the caller is not the council
            // ... apply default behavior
            return super.cancel(targets, values, calldatas, descriptionHash);
        }
    }

    /**
     * @dev Getter that returns the address of the council
     */
    function council() public view virtual returns (address) {
        return _council;
    }

    /**
     * @dev Update the council's address. This operation can only be performed through a governance proposal.
     *
     * Emits a {CouncilSet} event.
     */
    function setCouncil(address newCouncil) public virtual onlyGovernance {
        _setCouncil(newCouncil);
    }

    /**
     * @dev Internal setter for the council.
     *
     * Emits a {CouncilSet} event.
     */
    function _setCouncil(address newCouncil) internal virtual {
        emit CouncilSet(_council, newCouncil);
        _council = newCouncil;
    }
}
