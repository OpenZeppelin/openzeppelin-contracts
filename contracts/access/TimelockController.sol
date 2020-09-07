// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./../math/SafeMath.sol";
import "./AccessControl.sol";

/**
 * @dev Contract module which acts as a timelocked controller. When set as the
 * owner of an `Ownable` smart contract, it enforces a timelock on all
 * `onlyOwner` maintenance operations. This gives time for users of the
 * controlled contract to exit before a potentially dangerous maintenance
 * operation is applied.
 *
 * Timelocked operations are identified by a unique id (their hash) and follow
 * a specific lifecycle: `Unset` → `Pending` → `Ready` → `Done`
 *
 * - `Unset`: The operation is not part of the timelock mechanism
 *
 * - `Pending`: By calling the {schedule} (or {scheduleBatch}) method, the
 * operation moves from the `Unset` to the `Pending` state. This starts a timer
 * of at least `minDelay`.
 *
 * - `Ready`: After the timer expires, the operation moves from the `Pending` to
 * the `Ready` state. At this point, it can be executed.
 *
 * - `Done`: Once an operation is ready, calling the {execute} (or
 * {executeBatch}) method will process it and move it to the `Done` state. If
 * the operation has a predecessor, it should be in the `Done` state. The
 * operation shall not be executed twice. To execute the same instruction a
 * second time, restart the cycle with a different salt (thus producing a
 * different operation id).
 *
 * `Pending` and `Ready` operations can be cancelled using the {cancel} method.
 * This resets the operation to the `Unset` state, making it possibly
 * reschedule.
 *
 * This contract is designed to be self administered, meaning it should be its
 * own administrator. The proposer (resp executor) role is in charge of
 * proposing (resp executing) operation. A common use case is to position this
 * {TimelockController} as the owner of a smart contract, with a multisig or a
 * DAO as the sole proposer. Once at least one executer and one proposer have
 * been appointed, self-administration can be enable using the `makeLive`
 * function.
 *
 * WARNING: A live contract without at least one proposer and one executer is
 * locked. Make sure these roles are filled by reliable entities. See the
 * {AccessControl} documentation to learn more about role management. Once the
 * {TimelockController} contract is live, role management is performed through
 * timelocked operations.
 */

contract TimelockController is AccessControl {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");
    uint256 internal constant _DONE_TIMESTAMP = uint256(1);

    mapping(bytes32 => uint256) private _timestamps;
    uint256 private _minDelay;

    /**
     * @dev Emitted when a call is scheduled as part of operation `id`.
     */
    event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor);

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Emitted when operation `id` is cancelled.
     */
    event Cancelled(bytes32 indexed id);

    /**
     * @dev Emitted when the minimum delay for future operations is modified.
     */
    event MinDelayChange(uint256 newDuration, uint256 oldDuration);

    /**
     * @dev Initializes the contract with a given `minDelay`.
     */
    constructor(uint256 minDelay) public {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PROPOSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(EXECUTER_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, _msgSender());

        _minDelay = minDelay;
        emit MinDelayChange(minDelay, 0);
    }

    /**
     * @dev Modifier to make a function callable only by a certain role. In
     * addition to checking the sender's role, address(0)'s role is also
     * considered. Granting a role to Address(0) is equivalent to enabling this
     * role for everyone.
     */
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, _msgSender()) || hasRole(role, address(0)), "TimelockController: sender requiers permission");
        _;
    }

    /*
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    /**
     * @dev Returns whether an operation is pending or not.
     */
    function isOperationPending(bytes32 id) public view returns (bool pending) {
        return _timestamps[id] > _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns whether an operation is ready or not.
     */
    function isOperationReady(bytes32 id) public view returns (bool ready) {
        // solhint-disable-next-line not-rely-on-time
        return _timestamps[id] > _DONE_TIMESTAMP && _timestamps[id] <= block.timestamp;
    }

    /**
     * @dev Returns whether an operation is done or not.
     */
    function isOperationDone(bytes32 id) public view returns (bool done) {
        return _timestamps[id] == _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns the timestamp at with an operation becomes ready (0 for
     * unset operations, 1 for done operations).
     */
    function viewTimestamp(bytes32 id) public view returns (uint256 timestamp) {
        return _timestamps[id];
    }

    /**
     * @dev Returns the minimum delay for an operation to become valid.
     */
    function viewMinDelay() public view returns (uint256 duration) {
        return _minDelay;
    }

    /**
     * @dev Returns the identifier of an operation containing a single
     * transaction.
     */
    function hashOperation(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt) public pure returns (bytes32 hash) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Returns the identifier of an operation containing a batch of
     * transactions.
     */
    function hashOperationBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 predecessor, bytes32 salt) public pure returns (bytes32 hash) {
        return keccak256(abi.encode(targets, values, datas, predecessor, salt));
    }

    /**
     * @dev Schedule an operation containing a single transaction.
     *
     * Emits a {CallScheduled} event.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function schedule(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, uint256 delay) public onlyRole(PROPOSER_ROLE) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        _schedule(id, delay);
        emit CallScheduled(id, 0, target, value, data, predecessor);
    }

    /**
     * @dev Schedule an operation containing a batch of transactions.
     *
     * Emits one {CallScheduled} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function scheduleBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 predecessor, bytes32 salt, uint256 delay) public onlyRole(PROPOSER_ROLE) {
        require(targets.length == values.length, "TimelockController: length missmatch");
        require(targets.length == datas.length, "TimelockController: length missmatch");

        bytes32 id = hashOperationBatch(targets, values, datas, predecessor, salt);
        _schedule(id, delay);
        for (uint256 i = 0; i < targets.length; ++i) {
            emit CallScheduled(id, i, targets[i], values[i], datas[i], predecessor);
        }
    }

    /**
     * @dev Schedule an operation that is to becomes valid after a given delay.
     */
    function _schedule(bytes32 id, uint256 delay) internal {
        require(_timestamps[id] == 0, "TimelockController: operation already scheduled");
        require(delay >= _minDelay, "TimelockController: insufficient delay");
        // solhint-disable-next-line not-rely-on-time
        _timestamps[id] = SafeMath.add(block.timestamp, delay);
    }

    /**
     * @dev Cancel an operation.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function cancel(bytes32 id) public onlyRole(PROPOSER_ROLE) {
        require(!isOperationDone(id), "TimelockController: operation is already executed");
        delete _timestamps[id];

        emit Cancelled(id);
    }

    /**
     * @dev Execute an (ready) operation containing a single transaction.
     *
     * Emits a {CallExecuted} event.
     *
     * Requirements:
     *
     * - the caller must have the 'executer' role.
     */
    function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt) public payable onlyRole(EXECUTER_ROLE) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        _execute(id, predecessor);
        _call(id, 0, target, value, data);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per transaction in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executer' role.
     */
    function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 predecessor, bytes32 salt) public payable onlyRole(EXECUTER_ROLE) {
        require(targets.length == values.length, "TimelockController: length missmatch");
        require(targets.length == datas.length, "TimelockController: length missmatch");

        bytes32 id = hashOperationBatch(targets, values, datas, predecessor, salt);
        _execute(id, predecessor);
        for (uint256 i = 0; i < targets.length; ++i) {
            _call(id, i, targets[i], values[i], datas[i]);
        }
    }

    /**
     * @dev Execute an operation. Operation must be ready.
     */
    function _execute(bytes32 id, bytes32 predecessor) internal {
        require(isOperationReady(id), "TimelockController: operation is not ready");
        require(predecessor == bytes32(0) || isOperationDone(predecessor), "TimelockController: missing dependency");
        _timestamps[id] = _DONE_TIMESTAMP;
    }

    /**
     * @dev Execute a transaction.
     *
     * Emits a {CallExecuted} event.
     */
    function _call(bytes32 id, uint256 index, address target, uint256 value, bytes calldata data) internal returns (bool) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = target.call{value: value}(data);
        require(success, "TimelockController: underlying transaction reverted");

        emit CallExecuted(id, index, target, value, data);
    }

    /**
     * @dev Changes the timelock duration for future operations.
     *
     * Emits a {Timelock-MinDelayChange} event.
     */
    function updateDelay(uint256 newDelay) external {
        require(msg.sender == address(this), "TimelockController: restricted maintenance access");
        emit MinDelayChange(newDelay, _minDelay);
        _minDelay = newDelay;
    }

    /**
     * @dev Revocate the sender's administrative power, and give this role to
     * the timelock itself. All further maintenance will have to be performed
     * by the timelock itself using the commit/reveal workflow.
     *
     * Emits one {RoleGranted} and one {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be the only address with `ADMIN_ROLE`.
     * - there must be at least one account with 'PROPOSER_ROLE' and one with
     *   'EXECUTER_ROLE'.
     */
    function makeLive() external /* onlyRole(ADMIN_ROLE) */ {
        require(getRoleMemberCount(ADMIN_ROLE) == 1, "TimelockController: there should not be any other administrator");
        require(getRoleMemberCount(PROPOSER_ROLE) > 0, "TimelockController: at least one proposer is requied to make the contract live");
        require(getRoleMemberCount(EXECUTER_ROLE) > 0, "TimelockController: at least one executer is requied to make the contract live");
        grantRole(ADMIN_ROLE, address(this));
        revokeRole(ADMIN_ROLE, _msgSender());
    }
}

// Time tracking
// 28/08: 5h (5h)
// 30/08: 1h (6h)
//  1/09: 2h (8h)
//  2/09: 1h (9h)
//  3/09: 1h (10h)
//  5/09: 2h (12h)
//  7/09: 2h (14h)
