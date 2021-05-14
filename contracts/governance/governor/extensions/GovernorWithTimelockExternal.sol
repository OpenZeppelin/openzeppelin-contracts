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
    public virtual override returns (bytes32)
    {
        return super._execute(target, value, data, salt);
    }

    function execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public virtual override returns (bytes32)
    {
        _timelock.executeBatch(target, value, data, 0, salt);
        emit ProposalExecuted(hashProposal(target, value, data, salt));
    }

    function _calls(
        bytes32 id,
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

    function _afterExecute(
        bytes32 id,
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    internal virtual override
    {
        // solhint-disable-next-line not-rely-on-time
        uint256 eta = block.timestamp + _timelock.getMinDelay();
        emit ProposalQueued(id, eta);
    }
}
