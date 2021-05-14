// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IGovernorWithTimelock.sol";
import "../Governor.sol";
import "../../TimelockController.sol";

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

    function timelock() public view  returns (TimelockController) {
        return _timelock;
    }

    function updateTimelock(address newTimelock) external virtual {
        require(msg.sender == address(this), "GovernorIntegratedTimelock: caller must be governor");
        _updateTimelock(newTimelock);
    }

    function _updateTimelock(address newTimelock) internal virtual {
        emit TimelockChange(address(_timelock), newTimelock);
        _timelock = TimelockController(payable(newTimelock));
    }

    function queue(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        proposalId = _execute(target, value, data, salt);
        uint256 eta = block.timestamp + _timelock.getMinDelay();
        emit ProposalQueued(proposalId, eta);
    }

    function execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        proposalId = hashProposal(target, value, data, salt);
        _timelock.executeBatch(target, value, data, 0, salt);
        emit ProposalExecuted(proposalId);
    }

    function _calls(
        uint256 /*proposalId*/,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
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
