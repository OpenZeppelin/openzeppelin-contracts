// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockCompound.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWithERC20Votes.sol";

contract GovernorTimelockCompoundMock is GovernorTimelockCompound, GovernorWithERC20Votes, GovernorVotingSimple {
    constructor(
        string memory name_,
        address token_,
        address timelock_
    ) Governor(name_) GovernorTimelockCompound(timelock_) GovernorWithERC20Votes(token_) {}

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

    /**
     * Overriding nightmare
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        override(Governor, GovernorTimelockCompound)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual override(Governor, GovernorTimelockCompound) returns (uint256 proposalId) {
        return super.execute(targets, values, calldatas, salt);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal virtual override(Governor, GovernorTimelockCompound) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, salt);
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
