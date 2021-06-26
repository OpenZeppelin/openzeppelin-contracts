// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/Governor.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithERC20Votes.sol";

contract GovernanceMock is Governor, GovernorWithERC20Votes, GovernorVotingSimple {
    constructor(string memory name_, address token_) Governor(name_) GovernorWithERC20Votes(token_) {}

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

    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override(Governor, GovernorWithERC20Votes)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }
}
