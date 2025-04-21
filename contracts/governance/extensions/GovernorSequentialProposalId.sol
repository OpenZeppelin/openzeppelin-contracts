// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (governance/extensions/GovernorSequentialProposalId.sol)

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} that changes the numbering of proposal ids from the default hash-based approach to
 * sequential ids.
 */
abstract contract GovernorSequentialProposalId is Governor {
    uint256 private _latestProposalId;
    mapping(uint256 proposalHash => uint256 proposalId) private _proposalIds;

    /**
     * @dev The {latestProposalId} may only be initialized if it hasn't been set yet
     * (through initialization or the creation of a proposal).
     */
    error GovernorAlreadyInitializedLatestProposalId();

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
     * @dev Returns the latest proposal id. A return value of 0 means no proposals have been created yet.
     */
    function latestProposalId() public view virtual returns (uint256) {
        return _latestProposalId;
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
            _proposalIds[proposalHash] = ++_latestProposalId;
        }
        return super._propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @dev Internal function to set the {latestProposalId}. This function is helpful when transitioning
     * from another governance system. The next proposal id will be `newLatestProposalId` + 1.
     *
     * May only call this function if the current value of {latestProposalId} is 0.
     */
    function _initializeLatestProposalId(uint256 newLatestProposalId) internal virtual {
        if (_latestProposalId != 0) {
            revert GovernorAlreadyInitializedLatestProposalId();
        }
        _latestProposalId = newLatestProposalId;
    }
}
