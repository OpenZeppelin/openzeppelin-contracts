// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IERC20Votes.sol";
import "../governance/extensions/GovernorTimelockCompound.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithToken.sol";

contract GovernorTimelockCompoundMock is GovernorTimelockCompound, GovernorWithToken, GovernorVotingSimple {
    constructor(string memory name_, IERC20Votes token_, address timelock_)
    Governor(name_)
    GovernorTimelockCompound(timelock_)
    GovernorWithToken(token_)
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
