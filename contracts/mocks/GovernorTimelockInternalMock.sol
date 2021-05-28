// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IComp.sol";
import "../governance/extensions/GovernorTimelockInternal.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithToken.sol";

contract GovernorTimelockInternalMock is GovernorTimelockInternal, GovernorWithToken, GovernorVotingSimple {
    constructor(string memory name_, string memory version_, IComp token_, uint256 delay_)
    Governor(name_, version_)
    GovernorTimelockInternal(delay_)
    GovernorWithToken(token_)
    {
    }

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
