pragma solidity ^0.4.24;

import "./Claimable.sol";


/**
 * @title DelayedClaimable
 * @dev Extension for the Claimable contract, where the ownership needs to be claimed before/after
 * a certain block number.
 */
contract DelayedClaimable is Claimable {

  uint256 public end;
  uint256 public start;

  /**
   * @dev Used to specify the time period during which a pending
   * owner can claim ownership.
   * @param _start The earliest time ownership can be claimed.
   * @param _end The latest time ownership can be claimed.
   */
  function setLimits(uint256 _start, uint256 _end) onlyOwner public {
    require(_start <= _end);
    end = _end;
    start = _start;
  }

  /**
   * @dev Allows the pendingOwner address to finalize the transfer, as long as it is called within
   * the specified start and end time.
   */
  function claimOwnership() onlyPendingOwner public {
    require((block.number <= end) && (block.number >= start));
    emit OwnershipTransferred(owner, pendingOwner);
    owner = pendingOwner;
    pendingOwner = address(0);
    end = 0;
  }

}
