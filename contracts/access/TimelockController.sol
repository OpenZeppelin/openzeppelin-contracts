// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./AccessControl.sol";
import "../utils/Timelock.sol";

/**
 * @dev Contract module which acts as timelocked controller. When set as the
 * owner of an `Ownable` smartcontract, it enforces a timelock on all proxied
 * operations. This gives time for users of the controled contract to exit
 * before a potentially dangerous maintenance operation is applied.
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
 * {Timelock} contract is live, role management is performed through timelocked
 * operations.
 */

contract TimelockController is Timelock, AccessControl {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    /**
    * @dev Emitted when call is performed as part of operation `id`.
    */
    event Executed(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);

    /**
     * @dev Modifier to make a function callable only by a certain role.
     * In addition to looking to the sender's role, address(0)'s role is also considered.
     * Granting a role to Address(0) is thus equivalent to enabling this role for everyone.
     */
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, _msgSender()) || hasRole(role, address(0)), "Timelock: sender requiers permission");
        _;
    }

    /**
     * @dev Initializes the contract.
     */
    constructor(uint256 minDelay) public Timelock(minDelay) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /*
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    /**
     * @dev Submit an operation.
     *
     * Emits a {Commit} event.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
     */
    function commit(bytes32 id, uint256 delay) external onlyRole(PROPOSER_ROLE) {
        _commit(id, delay);
    }


    /**
    * @dev Cancel an operation.
     *
     * Emits a {Cancel} event.
     *
     * Requirements:
     *
     * - the caller must have the 'proposer' role.
    */
    function cancel(bytes32 id) external onlyRole(PROPOSER_ROLE) {
        _cancel(id);
    }

    /**
     * @dev Execute an (ready) operation containing a single transaction.
     *
     * Emits a {Reveal} and a {Executed} event.
     *
     * Requirements:
     *
     * - the caller must have the 'executer' role.
     */
    function reveal(address target, uint256 value, bytes calldata data, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        bytes32 id = keccak256(abi.encode(target, value, data, salt));
        _reveal(id);
        _execute(id, 0, target, value, data);
    }

    /**
     * @dev Execute an (ready) operation containing a batch of transactions.
     *
     * Emits a {Reveal} event and one {Executed} event per operation in the
     * batch.
     *
     * Requirements:
     *
     * - the caller must have the 'executer' role.
     */
    function revealBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas, bytes32 salt) external payable onlyRole(EXECUTER_ROLE) {
        require(targets.length == values.length, "Timelock: length missmatch");
        require(targets.length == datas.length, "Timelock: length missmatch");

        bytes32 id = keccak256(abi.encode(targets, values, datas, salt));
        _reveal(id);
        for (uint256 i = 0; i < targets.length; ++i) {
            _execute(id, i, targets[i], values[i], datas[i]);
        }
    }

    /**
     * @dev Execute a transaction.
     *
     * Emits a {Executed} event.
     */
    function _execute(bytes32 id, uint256 index, address target, uint256 value, bytes calldata data) internal returns (bool) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = target.call{value: value}(data);
        require(success, "Timelock: underlying transaction reverted");

        emit Executed(id, index, target, value, data);
    }


    /**
     * @dev Changes the timelock duration for future operations.
     *
     * Emits a {MinDelayChange} event.
     */
    function updateDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _updateDelay(newDelay);
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
    function makeLive() external /* onlyRole(DEFAULT_ADMIN_ROLE) */ {
        require(getRoleMemberCount(DEFAULT_ADMIN_ROLE) == 1, "Timelock: there should not be any other administrator");
        require(getRoleMemberCount(PROPOSER_ROLE) > 0, "Timelock: at least one proposer is requied to make the contract live");
        require(getRoleMemberCount(EXECUTER_ROLE) > 0, "Timelock: at least one executer is requied to make the contract live");
        grantRole(DEFAULT_ADMIN_ROLE, address(this));
        revokeRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }
}
