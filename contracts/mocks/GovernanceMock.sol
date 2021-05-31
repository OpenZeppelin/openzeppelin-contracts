// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IERC20Votes.sol";
import "../governance/Governor.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithToken.sol";

contract GovernanceMock is Governor, GovernorWithToken, GovernorVotingSimple {
    constructor(string memory name_, string memory version_, IERC20Votes token_)
    Governor(name_, version_)
    GovernorWithToken(token_)
    {
    }

    receive() external payable {}

    function votingDuration() public pure override returns (uint256) { return 7 days; } // FOR TESTING ONLY
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
