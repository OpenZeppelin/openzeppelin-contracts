// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./AccessControl.sol";

/**
 * @dev Contract module which acts as timelocked controller. When set as the
 * owner of an `Ownable` smartcontract, it enforces a timelock on all proxied
 * operations. This gives time for users of the controled contract to exit
 * before a potentially dangerous maintenance operation is applied.
 *
 * Timelock operations are identified by a unique id (their hash) and follow
 * a specific lifecycle: `Unset` → `Pending` → `Ready` → `Done`
 *
 * - `Unset`: The operation in not part of the timelock mechanism
 *
 * - `Pending`: By calling the {schedule} or {scheduleBatch} method, the
 * operation moves from the `Unset` to the `Pending` state. This states a timer
 * of at least `minDelay`.
 *
 * - `Ready`: After the timer expires, the operation moves from the `Pending` to
 * the `Ready` state. At this point it can be executed.
 *
 * - `Done`: Once an operation is ready, calling the {execute} or {executeBatch}
 * method will process it and move it to the `Done` state. If the operation has
 * a predecessor, it should be in the `Done` state. The operation shall not be
 * executed twice. To do so, restart the cycle with a different salt (thus
 * producing a dirrefent operation id).
 *
 * `Pending` and `Ready` operation can be canceled using the {cancel} method.
 * This resets the operation to the `Unset` state, making it possibly reschedule
 *
 * This contract is designed to be self administered, with maintenance
 * operations being proposed my a DAO or a multisig. A proposer and an executer
 * should be designed as soon as possible by the deployer. Administration
 * should then be handed to the contract itself by using the `makeLive`
 * function.
 *
 * WARNING: A live contract without at least one proposer and one executer is
 * locked. Make sure these role are filled by reliable entities. See the
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
     * @dev Emitted when call is scheduled as part of operation `id`.
     */
    event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor);

    /**
     * @dev Emitted when a call is performed as part of operation `id`.
     */
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Emitted when operation `id` is canceled.
     */
    event Canceled(bytes32 indexed id);

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
    }

    /**
     * @dev Modifier to make a function callable only by a certain role.
     * In addition to looking to the sender's role, address(0)'s role is also considered.
     * Granting a role to Address(0) is thus equivalent to enabling this role for everyone.
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
     * @dev Returns weither an operation is pending or not.
     */
    function isOperationPending(bytes32 id) public view returns (bool pending) {
        return _timestamps[id] > _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns weither an operation is ready or not.
     */
    function isOperationReady(bytes32 id) public view returns (bool ready) {
        // solhint-disable-next-line not-rely-on-time
        return _timestamps[id] > _DONE_TIMESTAMP && _timestamps[id] <= block.timestamp;
    }

    /**
     * @dev Returns weither an operation is done or not.
     */
    function isOperationDone(bytes32 id) public view returns (bool done) {
        return _timestamps[id] == _DONE_TIMESTAMP;
    }

    /**
     * @dev Returns the timestamp at with an operation becomes valid (0 for
     * unscheduled operation).
     */
    function viewTimestamp(bytes32 id) public view returns (uint256 timestamp) {
        return _timestamps[id];
    }

    /**
     * @dev Returns the minimum delay for a operation to become valid.
     */
    function viewMinDelay() public view returns (uint256 duration) {
        return _minDelay;
    }

    function hashOperation(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt) public pure returns (bytes32 hash) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    function hashOperationBatch(address[] memory targets, uint256[] memory values, bytes[] memory datas, bytes32 predecessor, bytes32 salt) public pure returns (bytes32 hash) {
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
    function schedule(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, uint256 delay) external payable onlyRole(PROPOSER_ROLE) {
        bytes32 id = keccak256(abi.encode(target, value, data, predecessor, salt));
        _schedule(id, delay);
        emit CallScheduled(id, 0, target, value, data, predecessor);
    }

    /**
     * @dev Schedule an operation containing a batch of transactions.
     *
     * Emits one {CallScheduled} event per
     * entry in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function scheduleBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 predecessor, bytes32 salt, uint256 delay) external payable onlyRole(PROPOSER_ROLE) {
        require(targets.length == values.length, "TimelockController: length missmatch");
        require(targets.length == datas.length, "TimelockController: length missmatch");

        bytes32 id = keccak256(abi.encode(targets, values, datas, predecessor, salt));
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
        _timestamps[id] = block.timestamp + delay;
    }

    /**
     * @dev Cancel an operation.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function cancel(bytes32 id) external onlyRole(PROPOSER_ROLE) {
        require(!isOperationDone(id), "TimelockController: operation is already executed");
        delete _timestamps[id];

        emit Canceled(id);
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
    function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        bytes32 id = keccak256(abi.encode(target, value, data, predecessor, salt));
        _execute(id, predecessor);
        _call(id, 0, target, value, data);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits one {CallExecuted} event per
     * entry in the batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executer' role.
     */
    function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 predecessor, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        require(targets.length == values.length, "TimelockController: length missmatch");
        require(targets.length == datas.length, "TimelockController: length missmatch");

        bytes32 id = keccak256(abi.encode(targets, values, datas, predecessor, salt));
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
     * @dev Revocake the sender's administrative power, and give this role to
     * the timelock itself. All further maintenance will have to be performed
     * by the timelock itself using the commit/reveal workflow.
     *
     * Emits one {RoleGranted} and one {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must be the only address with 'administration' role.
     * - there must be at least one account with role 'proposer' and one with
     *   role 'executer'.
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
