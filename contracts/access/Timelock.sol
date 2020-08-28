// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./Ownable.sol";

/**
 * @dev Contract module which acts as an ownership proxy, enforcing a timelock
 * on all proxied operations. This gives time for users of the controled
 * contract to exit before a potentially dangerous maintenance operation is
 * applied.
 */
contract Timelock is Ownable
{
	struct TX
	{
		address target;
		uint256 value;
		bytes   data;
		uint256 timestamp;
	}

	TX[]    private _ops;
	uint256 private _next;
	uint256 private _lockDuration;

	event TXScheduled(uint256 index);
	event TXExecuted(uint256 index, bool success);
	event TXCanceled(uint256 index);
	event LockDurationChange(uint256 newDuration, uint256 oldDuration);

	/**
	 * @dev Modifier to make a function callable only when the contract itself.
	 */
	modifier onlySelf()
	{
		require(msg.sender == address(this));
		_;
	}

	modifier dequeue()
	{
		require(_next < _ops.length, "empty-queue");
		_;
		delete _ops[_next];
		++_next;
	}

	/**
	 * @dev Initializes the contract
	 */
	constructor(uint256 lockDuration)
	public
	{
		_next = 0;
		_lockDuration = lockDuration;
	}

	/*
	 * @dev Contract might hold ETH
	 */
	receive()
	external payable
	{}






	function lockDuration()
	external view returns (uint256 duration)
	{
		return _lockDuration;
	}

	function nextTX()
	external view returns (uint256 index)
	{
		return _next;
	}

	function totalTX()
	external view returns (uint256 index)
	{
		return _ops.length;
	}

	function viewTX(uint256 index)
	external view returns (address target, uint256 value, bytes memory data, uint256 timestamp)
	{
		TX storage op = _ops[index];
		return (op.target, op.value, op.data, op.timestamp);
	}









	/**
	 * @dev Adds a new operation to the queue.
	 */
	function scheduleTX(address target, uint256 value, bytes calldata data)
	external onlyOwner()
	{
		// solhint-disable-next-line not-rely-on-time
		uint256 executeTime = block.timestamp + _lockDuration;
		_ops.push(TX(target, value, data, executeTime));

		emit TXScheduled(_ops.length - 1);
	}

	/**
	 * @dev Executes the next scheduled operation
	 */
	function executeTX()
	external payable onlyOwner() dequeue()
	{
		TX storage op = _ops[_next];
		// solhint-disable-next-line not-rely-on-time
		require(op.timestamp <= now, 'too-early-to-execute');
		// solhint-disable-next-line avoid-low-level-calls
		(bool success,) = op.target.call{value: op.value}(op.data);

		emit TXExecuted(_next, success);
	}

	/**
	 * @dev Cancel the next scheduled operation
	 */
	function cancelTX()
	external onlyOwner() dequeue()
	{
		emit TXCanceled(_next);
	}

	/**
	 * @dev Changes the timelock duration for future operations.
	 *
	 * Requirements:
	 *
	 * - This operation can only be called by the contract itself. It has to be
	 * scheduled and the timelock applies.
	 */
	function updateDuration(uint256 newLockDuration)
	external onlySelf()
	{
		emit LockDurationChange(newLockDuration, _lockDuration);
		_lockDuration = newLockDuration;
	}
}


// TO DISCUSS:
// - minimum delay
// - queue / unordered ?
// - if queue, cancellable ?
// - who can trigger the execution, onlyOwner() ?
// - don't lock the system on transaction faillure
// - reentry ?
// - commit/reveal
