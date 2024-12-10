// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} that changes the numbering of proposal ids from the default hash-based approach to
 * sequential ids.
 */
abstract contract GovernorSequentialProposalId is Governor {
    uint256 private _nextProposalId = 1;
    mapping(uint256 proposalHash => uint256 proposalId) private _proposalIds;

    /**
     * @dev The proposal count may only be set if the current proposal count is uninitialized.
     */
    error GovernorAlreadyInitializedNextProposalId();

    /**
     * @dev The proposal count may only be set to a non-zero value.
     */
    error GovernorInvalidNextProposalId();

    /**
     * @dev See {IGovernor-getProposalId}.
     */
    function getProposalId(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public view virtual override returns (uint256) {
        uint256 proposalHash = hashProposal(targets, values, calldatas, descriptionHash);
        uint256 storedProposalId = _proposalIds[proposalHash];
        if (storedProposalId == 0) {
            revert GovernorNonexistentProposal(0);
        }
        return storedProposalId;
    }

    /**
     * @dev Returns the next proposal id.
     */
    function nextProposalId() public view virtual returns (uint256) {
        return _nextProposalId;
    }

    /**
     * @dev See {IGovernor-_propose}.
     * Hook into the proposing mechanism to increment proposal count.
     */
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal virtual override returns (uint256) {
        uint256 proposalHash = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
        uint256 storedProposalId = _proposalIds[proposalHash];
        if (storedProposalId == 0) {
            _proposalIds[proposalHash] = _nextProposalId++;
        }
        return super._propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @dev Internal function to set the new {nextProposalId}.
     *
     * May only call this function if the current value of {nextProposalId} is one.
     */
    function _initializeNextProposalId(uint256 newNextProposalId) internal virtual {
        if (_nextProposalId != 1) {
            revert GovernorAlreadyInitializedNextProposalId();
        }
        if (newNextProposalId == 0) {
            revert GovernorInvalidNextProposalId();
        }
        _nextProposalId = newNextProposalId;
    }
}
