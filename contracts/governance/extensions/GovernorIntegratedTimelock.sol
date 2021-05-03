// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Governor.sol";

abstract contract GovernorIntegratedTimelock is Governor {
    uint256 private _delay;

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event DelayChange(uint256 oldDuration, uint256 newDuration);

    constructor(uint256 delay_) {
        _updateDelay(delay_);
    }

    function delay() public view virtual returns (uint256) {
        return _delay;
    }

    function updateDelay(uint256 newDelay) external virtual {
        require(msg.sender == address(this), "GovernorIntegratedTimelock: caller must be governor");
        _updateDelay(newDelay);
    }

    function _updateDelay(uint256 newDelay) internal virtual {
        emit DelayChange(_delay, newDelay);
        _delay = newDelay;
    }

    function _queue(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual returns (bytes32)
    {
        bytes32 id = hashProposal(target, value, data, salt);

        // check proposal readyness
        require(_isTimerAfter(id), "GovernorIntegratedTimelock: too early to queue");
        (,,uint256 supply, uint256 score) = viewProposal(id);
        require(supply >= quorum(), "Governance: quorum not reached");
        require(score >= supply * requiredScore(), "Governance: required score not reached");

        _startTimer(bytes32(uint256(id) + 1), delay());

        return id;
    }

    function _execute(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual override onlyAfterTimer(bytes32(uint256(id) + 1))
    {
        _resetTimer(bytes32(uint256(id) + 1));
        super._execute(id, target, value, data, salt);
    }
}
