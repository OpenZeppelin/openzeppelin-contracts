pragma solidity ^0.4.8;


import './Ownable.sol';


/**
 * @title Claimable
 * @dev Extension for the Ownable contract, where the ownership needs to be claimed. 
 * This allows the new owner to accept the transfer.
 */
contract Claimable is Ownable {
  address public pendingOwner;

  /**
   * @dev The onlyPendingOwner modifier throws if called by any account other than the 
   * pendingOwner. 
   */
  modifier onlyPendingOwner() {
    if (msg.sender != pendingOwner) {
      throw;
    }
    _;
  }

  /**
   * @dev The transferOwnership function allows the current owner to set the pendingOwner
   * address. 
   * @param pendingOwner The address to transfer ownership to. 
   */
  function transferOwnership(address newOwner) onlyOwner {
    pendingOwner = newOwner;
  }

  /**
   * @dev The claimOwnership function allows the pendingOwner address to finalize the transfer.
   */
  function claimOwnership() onlyPendingOwner {
    owner = pendingOwner;
    pendingOwner = 0x0;
  }

}
