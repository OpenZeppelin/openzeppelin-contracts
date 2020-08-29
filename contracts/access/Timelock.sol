// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Ownable.sol";

/**
 * @dev Contract module which acts as an ownership proxy, enforcing a timelock
 * on all proxied operations. This gives time for users of the controled
 * contract to exit before a potentially dangerous maintenance operation is
 * applied.
 */
contract Timelock is Ownable
{
    mapping(bytes32 => uint256) private _commitments;
    uint256 private _minDelay;

    event Commitment(bytes32 indexed id);
    event Executed(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);
    event Canceled(bytes32 indexed id);
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Modifier to make a function callable only when the contract itself.
     */
    modifier onlySelf() {
        require(msg.sender == address(this), 'only-self-calls');
        _;
    }

    /**
     * @dev Initializes the contract
     */
    constructor(uint256 minDelay) public {
        _minDelay = minDelay;
    }

    /*
     * @dev Contract might receive/hold ETH as part of the maintenance process
     */
    receive() external payable {}

    /**
     * @dev
     */
    function viewCommitment(bytes32 id) external view returns (uint256 timestamp) {
        return _commitments[id];
    }

    /**
     * @dev
     */
    function viewMinDelay() external view returns (uint256 duration) {
        return _minDelay;
    }

    /**
     * @dev
     */
    function commit(bytes32 id, uint256 delay) external onlyOwner() {
        require(_commitments[id] == 0, 'commitment-already-exists');
        require(delay >= _minDelay, 'inssuficient-delay');
        _commitments[id] = block.timestamp + delay;

        emit Commitment(id);
    }

    /**
    * @dev
    */
    function cancel(bytes32 id) external onlyOwner() {
        delete _commitments[id];

        emit Canceled(id);
    }

    /**
     * @dev
     */
    function reveal(address target, uint256 value, bytes calldata data, bytes32 salt) external payable onlyOwner() {
        bytes32 id = keccak256(abi.encode(target, value, data, salt));
        require(_commitments[id] > 0, 'no-matching-commitment');
        require(_commitments[id] <= block.timestamp, 'too-early-to-execute');

        _execute(id, 0, target, value, data);

        delete _commitments[id];
    }

    /**
     * @dev
     */
    function revealBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 salt) external payable onlyOwner() {
        require(targets.length == values.length, 'length-missmatch');
        require(targets.length == datas.length, 'length-missmatch');

        bytes32 id = keccak256(abi.encode(targets, values, datas, salt));
        require(_commitments[id] > 0, 'no-matching-commitment');
        require(_commitments[id] <= block.timestamp, 'too-early-to-execute');

        for (uint256 i = 0; i < targets.length; ++i) {
            _execute(id, i, targets[i], values[i], datas[i]);
        }

        delete _commitments[id];
    }

    /**
     * @dev
     */
     function _execute(bytes32 id, uint256 index, address target, uint256 value, bytes calldata data) internal returns (bool)
     {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = target.call{value: value}(data);
        require(success, 'underlying-transaction-failled');

        emit Executed(id, index, target, value, data);
     }

    /**
     * @dev Changes the timelock duration for future operations.
     *
     * Requirements:
     *
     * - This operation can only be called by the contract itself. It has to be
     * scheduled and the timelock applies.
     */
    function updateDelay(uint256 newDelay)
    external onlySelf()
    {
        emit MinDelayChange(newDelay, _minDelay);
        _minDelay = newDelay;
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

// 28/08: 3h+2h
