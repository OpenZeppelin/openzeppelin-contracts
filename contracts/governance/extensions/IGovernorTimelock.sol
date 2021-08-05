// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

/**
 * @dev Extension of the {IGovernor} for timelock supporting modules.
 *
 * _Available since v4.3._
 */
interface IGovernorTimelock {
    event ProposalQueued(uint256 proposalId, uint256 eta);

    function timelock() external view returns (address);

    function proposalEta(uint256 proposalId) external view returns (uint256);

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256 proposalId);
}

/**
 * @dev Equivalent to {IGovernor} but with public functions.
 *
 * _Available since v4.3._
 */
abstract contract AGovernorTimelock is IGovernorTimelock, AGovernor {
    function timelock() public view virtual override returns (address);

    function proposalEta(uint256 proposalId) public view virtual override returns (uint256);

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual override returns (uint256 proposalId);
}
