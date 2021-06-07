// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/Governor.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithERC20VotesComp.sol";

contract GovernanceCompMock is Governor, GovernorWithERC20VotesComp, GovernorVotingSimple {
    constructor(string memory name_, address token_) Governor(name_) GovernorWithERC20VotesComp(token_) {}

    receive() external payable {}

    function votingDuration() public pure override returns (uint64) {
        return 7 days;
    } // FOR TESTING ONLY

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
