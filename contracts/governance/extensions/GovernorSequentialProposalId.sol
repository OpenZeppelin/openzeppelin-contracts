// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";

abstract contract GovernorSequentialProposalId is Governor {
    uint256 private _numberOfProposals;
    mapping(uint256 proposalHash => uint256 proposalId) private _proposalIds;

    function _getProposalId(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalHash = super._getProposalId(targets, values, calldatas, descriptionHash);

        uint256 storedProposalId = _proposalIds[proposalHash];
        return storedProposalId == 0 ? (_proposalIds[proposalHash] = ++_numberOfProposals) : storedProposalId;
    }
}
