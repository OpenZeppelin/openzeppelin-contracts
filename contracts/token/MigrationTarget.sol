pragma solidity ^0.4.11;

/**
 * @title Migration target
 * @dev Implement this interface to make migration target
 */
contract MigrationTarget {
  function migrateFrom(address _from, uint256 _amount) external;
}
