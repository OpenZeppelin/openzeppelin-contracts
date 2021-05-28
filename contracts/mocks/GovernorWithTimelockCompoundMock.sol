// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IComp.sol";
import "../governance/extensions/GovernorWithTimelockCompound.sol";
import "../governance/extensions/WithVoteToken.sol";

contract GovernorWithTimelockCompoundMock is GovernorWithTimelockCompound, WithVoteToken {
    constructor(string memory name_, string memory version_, IComp token_, address timelock_)
    EIP712(name_, version_)
    GovernorWithTimelockCompound(timelock_)
    WithVoteToken(token_)
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
