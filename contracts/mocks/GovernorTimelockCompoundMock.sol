// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockCompound.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithERC20Votes.sol";

contract GovernorTimelockCompoundMock is GovernorTimelockCompound, GovernorWithERC20Votes, GovernorVotingSimple {
    constructor(string memory name_, address token_, address timelock_)
    Governor(name_)
    GovernorTimelockCompound(timelock_)
    GovernorWithERC20Votes(token_)
    {
    }

    function votingDuration() public pure override returns (uint64)  { return 7 days; } // FOR TESTING ONLY
    function quorum(uint256)  public pure override returns (uint256) { return 1;      }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
    }
}
