// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev TODO
 *
 * _Available since v4.2._
 */
interface IGovernorTimelock {
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);

    function timelock() external view returns (address);

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) external returns (uint256 proposalId);
}
