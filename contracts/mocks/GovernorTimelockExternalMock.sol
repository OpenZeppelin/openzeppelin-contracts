// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockExternal.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithERC20Votes.sol";

contract GovernorTimelockExternalMock is GovernorTimelockExternal, GovernorWithERC20Votes, GovernorVotingSimple {
    constructor(
        string memory name_,
        address token_,
        address timelock_
    ) Governor(name_) GovernorTimelockExternal(timelock_) GovernorWithERC20Votes(token_) {}

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
}
