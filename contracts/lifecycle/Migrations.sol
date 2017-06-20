pragma solidity ^0.4.11;


import '../ownership/Ownable.sol';

/**
 * @title Migrations
 * @dev This is a truffle contract, needed for truffle integration, not meant for use by Zeppelin users.
 */
contract Migrations is Ownable {
  uint256 public lastCompletedMigration;

  function setCompleted(uint256 completed) onlyOwner {
    lastCompletedMigration = completed;
  }

  function upgrade(address newAddress) onlyOwner {
    Migrations upgraded = Migrations(newAddress);
    upgraded.setCompleted(lastCompletedMigration);
  }
}
