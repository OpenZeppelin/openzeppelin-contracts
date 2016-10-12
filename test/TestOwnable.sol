pragma solidity ^0.4.0;
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Ownable.sol";

contract TestOwnable {
  Ownable ownable = new Ownable();

  function testHasOwner() {
    Assert.isNotZero(ownable.owner(), "Ownable should have an owner upon creation.");
  }

  function testChangesOwner() {
    address originalOwner = ownable.owner();
    ownable.transfer(0x0);
    Assert.notEqual(originalOwner, ownable.owner(), "Ownable should change owners after transfer.");
  }

  function testOnlyOwnerCanChangeOwner() {
    Ownable deployedOwnable = Ownable(DeployedAddresses.Ownable());
    address originalOwner = deployedOwnable.owner();
    deployedOwnable.transfer(0x0);
    Assert.equal(originalOwner, deployedOwnable.owner(), "Ownable should prevent non-owners from transfering");
  }
}
