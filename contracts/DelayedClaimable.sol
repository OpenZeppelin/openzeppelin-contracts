pragma solidity ^0.4.4;
import './Ownable.sol';
import './Claimable.sol';

/*
 * DelayedClaimable
 * Extension for the Claimable contract, where the ownership needs to be claimed before/after certain block number
 */

contract DelayedClaimable is Ownable, Claimable {

  uint public claimBeforeBlock;
  uint public claimAfterBlock;

  function setClaimBlocks(uint _claimBeforeBlock, uint _claimAfterBlock) onlyOwner {
    if (_claimAfterBlock > claimBeforeBlock)
        throw;
    claimBeforeBlock = _claimBeforeBlock;
    claimAfterBlock = _claimAfterBlock;
  }

  function claimOwnership() onlyPendingOwner {
    if ((block.number > claimBeforeBlock) || (block.number < claimAfterBlock))
        throw;
    owner = pendingOwner;
    pendingOwner = 0x0;
    claimBeforeBlock = 0;
  }

}
