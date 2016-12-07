pragma solidity ^0.4.4;
import './Ownable.sol';
import './Claimable.sol';

/*
 * DelayedClaimable
 * Extension for the Claimable contract, where the ownership needs to be claimed before certain block number
 */

contract DelayedClaimable is Ownable, Claimable {
  uint public claimBeforeBlock;

  function setClaimBefore(uint _claimBeforeBlock) onlyOwner {
    claimBeforeBlock = _claimBeforeBlock;
  }

  function claimOwnership() onlyPendingOwner {
    if (block.number > claimBeforeBlock) throw;
    owner = pendingOwner;
    pendingOwner = 0x0;
    claimBeforeBlock = 0;
  }

}
