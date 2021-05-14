// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IGovernorWithTimelock {
    /**
     * Events
     */
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);

    // Only available through a "timelock" modules (internal / external OZ / external Compound)
    // No checks, can be added through inheritance
    function queue(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 salt
    ) public virtual returns (uint256 proposalId);
}
