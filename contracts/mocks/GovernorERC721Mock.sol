// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotesERC721.sol";

contract GovernorERC721Mock is GovernorVotesERC721, GovernorCountingSimple {
    constructor(string memory name_, ERC721Votes token_) Governor(name_) GovernorVotesERC721(token_) {}

    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function votingDelay() public pure override returns (uint256) {
        return 4;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 16;
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
        override(IGovernor, GovernorVotesERC721)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }
}
