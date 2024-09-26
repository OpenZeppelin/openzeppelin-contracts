// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorStorage.sol)

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

/**
 * @dev Extension of {Governor} that implements storage of proposal details. This modules also provides primitives for
 * the enumerability of proposals.
 *
 * Use cases for this module include:
 * - UIs that explore the proposal state without relying on event indexing.
 * - Using only the proposalId as an argument in the {Governor-queue} and {Governor-execute} functions for L2 chains
 *   where storage is cheap compared to calldata.
 */
abstract contract GovernorStorage is Governor {
    struct ProposalDetails {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bytes32 descriptionHash;
    }

    uint256[] private _proposalIds;
    mapping(uint256 proposalId => ProposalDetails) private _proposalDetails;

    /**
     * @dev Hook into the proposing mechanism
     */
    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal virtual override returns (uint256) {
        uint256 proposalId = super._propose(targets, values, calldatas, description, proposer);

        // store
        _proposalIds.push(proposalId);
        _proposalDetails[proposalId] = ProposalDetails({
            targets: targets,
            values: values,
            calldatas: calldatas,
            descriptionHash: keccak256(bytes(description))
        });

        return proposalId;
    }

    /**
     * @dev Version of {IGovernorTimelock-queue} with only `proposalId` as an argument.
     */
    function queue(uint256 proposalId) public virtual {
        // here, using storage is more efficient than memory
        ProposalDetails storage details = _proposalDetails[proposalId];
        queue(details.targets, details.values, details.calldatas, details.descriptionHash);
    }

    /**
     * @dev Version of {IGovernor-execute} with only `proposalId` as an argument.
     */
    function execute(uint256 proposalId) public payable virtual {
        // here, using storage is more efficient than memory
        ProposalDetails storage details = _proposalDetails[proposalId];
        execute(details.targets, details.values, details.calldatas, details.descriptionHash);
    }

    /**
     * @dev ProposalId version of {IGovernor-cancel}.
     */
    function cancel(uint256 proposalId) public virtual {
        // here, using storage is more efficient than memory
        ProposalDetails storage details = _proposalDetails[proposalId];
        cancel(details.targets, details.values, details.calldatas, details.descriptionHash);
    }

    /**
     * @dev Returns the number of stored proposals.
     */
    function proposalCount() public view virtual returns (uint256) {
        return _proposalIds.length;
    }

    /**
     * @dev Returns the details of a proposalId. Reverts if `proposalId` is not a known proposal.
     */
    function proposalDetails(
        uint256 proposalId
    )
        public
        view
        virtual
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    {
        // here, using memory is more efficient than storage
        ProposalDetails memory details = _proposalDetails[proposalId];
        if (details.descriptionHash == 0) {
            revert GovernorNonexistentProposal(proposalId);
        }
        return (details.targets, details.values, details.calldatas, details.descriptionHash);
    }

    /**
     * @dev Returns the details (including the proposalId) of a proposal given its sequential index.
     */
    function proposalDetailsAt(
        uint256 index
    )
        public
        view
        virtual
        returns (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            bytes32 descriptionHash
        )
    {
        proposalId = _proposalIds[index];
        (targets, values, calldatas, descriptionHash) = proposalDetails(proposalId);
    }
}
