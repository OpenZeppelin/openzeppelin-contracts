pragma solidity ^0.4.4;
import './Ownable.sol';
import './Claimable.sol';

/*
 * DelayedClaimable
 * Extension for the Claimable contract, where the ownership needs to be claimed before certain time
 */

contract DelayedClaimable is Ownable, Claimable {
  uint public claimBefore;

  function setDelay(uint _claimBefore) onlyOwner {
    claimBefore = _claimBefore;
  }

  function claimOwnership() onlyPendingOwner {
    if (block.number > claimBefore)
        throw;
    owner = pendingOwner;
    pendingOwner = 0x0;
    claimBefore = 0;
  }

}
