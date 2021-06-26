// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/compatibility/GovernorCompound.sol";
import "../governance/extensions/GovernorWithERC20VotesComp.sol";
import "../governance/extensions/GovernorTimelockCompound.sol";

contract GovernorCompoundMock is GovernorCompound, GovernorTimelockCompound, GovernorWithERC20VotesComp {
    constructor(
        string memory name_,
        address token_,
        address timelock_
    ) Governor(name_) GovernorWithERC20VotesComp(token_) GovernorTimelockCompound(timelock_) {}

    receive() external payable {}

    function votingPeriod() public pure override returns (uint64) {
        return 16; // blocks
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 1;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override(IGovernor, GovernorCompound) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
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
        override(IGovernor, GovernorWithERC20VotesComp)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }
}
