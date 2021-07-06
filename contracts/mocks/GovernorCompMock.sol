// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/Governor.sol";
import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotesComp.sol";

contract GovernorCompMock is Governor, GovernorVotesComp, GovernorCountingSimple {
    constructor(string memory name_, address token_) Governor(name_) GovernorVotesComp(token_) {}

    receive() external payable {}

    function votingPeriod() public pure override returns (uint256) {
        return 16; // blocks
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 0;
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
        override(Governor, GovernorVotesComp)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }
}
