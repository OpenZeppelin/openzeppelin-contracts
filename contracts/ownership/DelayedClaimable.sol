pragma solidity ^0.4.8;


import './Ownable.sol';
import './Claimable.sol';


/*
 * DelayedClaimable
 * Extension for the Claimable contract, where the ownership needs to be claimed before/after certain block number
 */
contract DelayedClaimable is Ownable, Claimable {

  uint public end;
  uint public start;

  function setLimits(uint _start, uint _end) onlyOwner {
    if (_start > _end)
        throw;
    end = _end;
    start = _start;
  }

  function claimOwnership() onlyPendingOwner {
    if ((block.number > end) || (block.number < start))
        throw;
    owner = pendingOwner;
    pendingOwner = 0x0;
    end = 0;
  }

}
