// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

abstract contract GovernorSequentialProposalId is Governor {
    uint256 private _proposalCount;
    mapping(uint256 proposalHash => uint256 proposalId) private _proposalIds;

    /**
     * @dev The proposal count may only be set if the current proposal count is 0 in {_setProposalCount}.
     */
    error GovernorCanNotSetProposalCount();

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
            _proposalIds[proposalHash] = ++_proposalCount;
        }
        return super._propose(targets, values, calldatas, description, proposer);
    }

    /**
     * @dev Internal function to set the current proposal count--the next proposal id will be `newProposalCount` + 1.
     *
     * May only call this function if the current proposal count is 0.
     */
    function _setProposalCount(uint256 newProposalCount) internal virtual {
        if (_proposalCount != 0) {
            revert GovernorCanNotSetProposalCount();
        }
        _proposalCount = newProposalCount;
    }

    function proposalCount() public view virtual returns (uint256) {
        return _proposalCount;
    }
}
