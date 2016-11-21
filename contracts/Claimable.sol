pragma solidity ^0.4.0;
import './Ownable.sol';

/*
 * Claimable
 * Extension for the Ownable contract, where the ownership needs to be claimed
 */

contract Claimable is Ownable {
  address public pendingOwner;

  modifier onlyPendingOwner() {
    if (msg.sender == pendingOwner)
      _;
  }

  function transfer(address newOwner) onlyOwner {
    pendingOwner = newOwner;
  }

  function claimOwnership() onlyPendingOwner {
    owner = pendingOwner;
    pendingOwner = 0x0;
  }

}
