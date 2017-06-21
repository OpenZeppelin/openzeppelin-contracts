pragma solidity ^0.4.11;

import '../ownership/Ownable.sol';
import './Migratable.sol';
import './MigrationTarget.sol';
import './StandardToken.sol';

/**
 * @title MigratableToken
 * @dev Migration support for ERC20 token
 */
contract MigratableToken is StandardToken, Ownable, Migratable {
  // Target contract
  address public migrationTarget;
  uint256 public totalMigrated;

  bool public migrating = false;

  // Migrate event
  event Migrate(address indexed _from, address indexed _to, uint256 _value);
  event StartMigration();
  event StopMigration();

  /**
   * @dev modifier to allow actions only when the migration is started
   */
  modifier whenNotMigrating() {
    if (migrating) throw;
    _;
  }

  /**
   * @dev modifier to allow actions only when the migration is not started
   */
  modifier whenMigrating() {
    if (!migrating) throw;
    _;
  }

  /**
   * @notice Migrate tokens to the new token contract.
   * @param _amount The amount of token to be migrated
   */
  function migrate(uint256 _amount) whenMigrating external {
    if (migrationTarget == 0x0 || migrationTarget == address(this)) throw;
    if (_amount == 0) throw;

    balances[msg.sender] = balances[msg.sender].sub(_amount);
    totalSupply = totalSupply.sub(_amount);
    totalMigrated = totalMigrated.add(_amount);
    MigrationTarget(migrationTarget).migrateFrom(msg.sender, _amount);
    Migrate(msg.sender, migrationTarget, _amount);
  }

  /**
   * @dev Set address of migration target contract
   * @param _target The address of the MigrationTarget contract
   */
  function setMigrationTarget(address _target) onlyOwner external {
    if (migrationTarget != 0x0) throw;
    migrationTarget = _target;
  }

  /**
   * @dev called by the owner to start migration, triggers stopped state
   */
  function startMigration() onlyOwner whenNotMigrating  external returns (bool) {
    migrating = true;
    StartMigration();
    return true;
  }

  /**
   * @dev called by the owner to stop migration, returns to normal state
   */
  function stopMigration() onlyOwner whenMigrating  external returns (bool) {
    migrating = false;
    StopMigration();
    return true;
  }
}
