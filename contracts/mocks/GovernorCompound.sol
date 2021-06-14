// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/compatibility/GovernorCompound.sol";
import "../governance/extensions/GovernorWithERC20VotesComp.sol";
import "../governance/extensions/GovernorTimelockCompound.sol";

contract GovernorCompoundMock is GovernorCompound, GovernorTimelockCompound, GovernorWithERC20VotesComp {
    constructor(
        string memory name_,
        address token_,
        address timelock_
    ) Governor(name_) GovernorWithERC20VotesComp(token_) GovernorTimelockCompound(timelock_) {}

    receive() external payable {}

    function votingPeriod() public pure override returns (uint64) {
        return 16; // blocks
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 1;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal virtual override(Governor, GovernorTimelockCompound) returns (uint256 proposalId) {
        return GovernorTimelockCompound._cancel(targets, values, calldatas, salt);
    }
}
