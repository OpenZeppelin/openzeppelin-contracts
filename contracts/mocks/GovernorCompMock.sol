// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorSettings.sol";
import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotesComp.sol";

contract GovernorCompMock is GovernorSettings, GovernorVotesComp, GovernorCountingSimple {
    constructor(
        string memory name_,
        ERC20VotesComp token_,
        uint256 votingDelay_,
        uint256 votingPeriod_
    ) Governor(name_) GovernorSettings(votingDelay_, votingPeriod_, 0) GovernorVotesComp(token_) {}

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
        override(IGovernor, GovernorVotesComp)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
