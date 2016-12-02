pragma solidity ^0.4.4;
import './Ownable.sol';

contract Migrations is Ownable {
  uint public lastCompletedMigration;

  function setCompleted(uint completed) onlyOwner {
    lastCompletedMigration = completed;
  }

  function upgrade(address newAddress) onlyOwner {
    Migrations upgraded = Migrations(newAddress);
    upgraded.setCompleted(lastCompletedMigration);
  }
}
