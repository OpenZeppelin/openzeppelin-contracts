// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (governance/extensions/GovernorProposalThreshold.sol)

pragma solidity ^0.8.0;

import "../Governor.sol";

/**
 * @dev Extension of {Governor} for proposal restriction to token holders with a minimum balance.
 *
 * _Available since v4.3._
 * _Deprecated since v4.4._
 */
abstract contract GovernorProposalThreshold is Governor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
}
