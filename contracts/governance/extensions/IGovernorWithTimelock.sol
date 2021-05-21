// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IGovernorWithTimelock {
    /**
     * Events
     */
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);

    function timelock()
    public view virtual returns (address);

    // Only available through a "timelock" modules (internal / external OZ / external Compound)
    // No checks, can be added through inheritance
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual returns (uint256 proposalId);
}
