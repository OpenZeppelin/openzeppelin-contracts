pragma solidity ^0.4.0;


import './Ownable.sol';


/*
 * Claimable
 *
 * Extension for the Ownable contract, where the ownership needs to be claimed. This allows the new owner to accept the transfer.
 */
contract Claimable is Ownable {
  address public pendingOwner;

  modifier onlyPendingOwner() {
    if (msg.sender != pendingOwner) {
      throw;
    }
    _;
  }

  function transferOwnership(address newOwner) onlyOwner {
    pendingOwner = newOwner;
  }

  function claimOwnership() onlyPendingOwner {
    owner = pendingOwner;
    pendingOwner = 0x0;
  }

}
