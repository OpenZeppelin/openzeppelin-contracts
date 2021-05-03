// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GovernorIntegratedTimelock.sol";
import "../TimelockController.sol";

abstract contract GovernorExternalTimelock is GovernorIntegratedTimelock {
    TimelockController private _timelock;

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event TimelockChange(address oldTimelock, address newTimelock);

    constructor(address timelock_, uint256 delay_)
    GovernorIntegratedTimelock(delay_)
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

    function _queue(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual override returns (bytes32)
    {
        bytes32 id = hashProposal(target, value, data, salt);

        require(_isTimerAfter(id), "GovernorIntegratedTimelock: too early to queue");
        (,,uint256 supply, uint256 score) = viewProposal(id);
        require(supply >= quorum(), "Governance: quorum not reached");
        require(score >= supply * requiredScore(), "Governance: required score not reached");

        _timelock.scheduleBatch(target, value, data, 0, salt, delay());

        return id;
    }

    function _execute(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual override
    {
        // check proposal readyness
        require(_isTimerAfter(id), "GovernorIntegratedTimelock: too early to queue");
        (,,uint256 supply, uint256 score) = viewProposal(id);
        require(supply >= quorum(), "Governance: quorum not reached");
        require(score >= supply * requiredScore(), "Governance: required score not reached");

        _resetTimer(id); // check timer expired + reset
        _lockTimer(id); // avoid double execution

        _timelock.executeBatch(target, value, data, 0, salt);
    }
}
