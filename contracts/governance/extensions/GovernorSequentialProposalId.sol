// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

abstract contract GovernorSequentialProposalId is Governor {
    uint256 public numProposals;
    mapping(bytes32 proposalHash => uint256 proposalId) private _proposalIds;

    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual override returns (uint256) {
        bytes32 proposalHash = keccak256(abi.encode(targets, values, calldatas, descriptionHash));

        uint256 storedProposalId = _proposalIds[proposalHash];
        if (storedProposalId == 0) {
            _proposalIds[proposalHash] = ++numProposals;
            return numProposals;
        }

        return storedProposalId;
    }
}
