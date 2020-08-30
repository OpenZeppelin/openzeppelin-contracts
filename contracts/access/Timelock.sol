// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./AccessControl.sol";

/**
 * @dev Contract module which acts as an ownership proxy, enforcing a timelock
 * on all proxied operations. This gives time for users of the controled
 * contract to exit before a potentially dangerous maintenance operation is
 * applied.
 */
contract Timelock is AccessControl
{
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    mapping(bytes32 => uint256) private _commitments;
    uint256 private _minDelay;

    event Commitment(bytes32 indexed id);
    event Executed(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);
    event Canceled(bytes32 indexed id);
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Modifier to make a function callable only when the contract itself.
     */
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, _msgSender()), "Timelock: sender requiers permission");
        _;
    }

    /**
     * @dev Initializes the contract
     */
    constructor(uint256 minDelay) public {
        _minDelay = minDelay;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
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
    function commit(bytes32 id, uint256 delay) external onlyRole(PROPOSER_ROLE) {
        require(_commitments[id] == 0, 'Timelock: commitment already exists');
        require(delay >= _minDelay, 'Timelock: insufficient delay');
        _commitments[id] = block.timestamp + delay;

        emit Commitment(id);
    }

    /**
    * @dev
    */
    function cancel(bytes32 id) external onlyRole(PROPOSER_ROLE) {
        delete _commitments[id];

        emit Canceled(id);
    }

    /**
     * @dev
     */
    function reveal(address target, uint256 value, bytes calldata data, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        bytes32 id = keccak256(abi.encode(target, value, data, salt));
        require(_commitments[id] > 0, 'Timelock: no matching commitment');
        require(_commitments[id] <= block.timestamp, 'Timelock: too early to execute');

        _execute(id, 0, target, value, data);

        delete _commitments[id];
    }

    /**
     * @dev
     */
    function revealBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        require(targets.length == values.length, 'Timelock: length missmatch');
        require(targets.length == datas.length, 'Timelock: length missmatch');

        bytes32 id = keccak256(abi.encode(targets, values, datas, salt));
        require(_commitments[id] > 0, 'Timelock: no matching commitment');
        require(_commitments[id] <= block.timestamp, 'Timelock: too early to execute');

        for (uint256 i = 0; i < targets.length; ++i) {
            _execute(id, i, targets[i], values[i], datas[i]);
        }

        delete _commitments[id];
    }

    /**
     * @dev
     */
    function _execute(bytes32 id, uint256 index, address target, uint256 value, bytes calldata data) internal returns (bool) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = target.call{value: value}(data);
        require(success, 'Timelock: underlying transaction reverted');

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
    function updateDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
