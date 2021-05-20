// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorWithTimelock.sol";
import "../Governor.sol";
import "../TimelockController.sol";

abstract contract GovernorWithTimelockExternal is IGovernorWithTimelock, Governor {
    TimelockController private _timelock;

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    constructor(address timelock_)
    {
        _updateTimelock(timelock_);
    }

    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(this), "GovernorIntegratedTimelock: caller must be governor");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) internal virtual {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = TimelockController(payable(newTimelock));
    }

    function timelock() public virtual override returns (address) {
        return address(_timelock);
    }

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        // _call is overriden to customize _execute action (while keeping the checks)
        proposalId = _execute(targets, values, calldatas, salt);
        uint256 eta = block.timestamp + _timelock.getMinDelay();
        emit ProposalQueued(proposalId, eta);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, salt);
        _timelock.executeBatch(targets, values, calldatas, 0, salt);
        emit ProposalExecuted(proposalId);
    }

    function _calls(
        uint256 /*proposalId*/,
        address[] memory target,
        uint256[] memory value,
        bytes[] memory data,
        bytes32 salt
    )
    internal virtual override
    {
        _timelock.scheduleBatch(
            target,
            value,
            data,
            0,
            salt,
            _timelock.getMinDelay()
        );
    }
}
