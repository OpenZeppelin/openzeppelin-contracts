// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Extension of the {IGovernor} for timelock supporting modules.
 *
 * _Available since v4.2._
 */
abstract contract IGovernorTimelock {
    event ProposalQueued(uint256 proposalId, uint256 eta);

    function timelock() public view virtual returns (address);

    function proposalEta(uint256 proposalId) public view virtual returns (uint256);

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual returns (uint256 proposalId);
}
