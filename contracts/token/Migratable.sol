pragma solidity ^0.4.11;

/**
 * @title Migratable
 * @dev Implement this interface to make contract migratable
 */
contract Migratable {
  function migrate(uint256 _amount) external;
}
