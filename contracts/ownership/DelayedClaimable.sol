pragma solidity ^0.4.24;

import "./Claimable.sol";


/**
 * @title DelayedClaimable
 * @dev Extension for the Claimable contract, where the ownership needs to be claimed before/after
 * a certain block number.
 */
contract DelayedClaimable is Claimable {

  uint256 private start_;
  uint256 private end_;

  /**
   * @return the start of the claimable period.
   */
  function start() public view returns(uint256) {
    return start_;
  }

  /**
   * @return the end of the claimable period.
   */
  function end() public view returns(uint256) {
    return end_;
  }

  /**
   * @dev Used to specify the time period during which a pending
   * owner can claim ownership.
   * @param _start The earliest time ownership can be claimed.
   * @param _end The latest time ownership can be claimed.
   */
  function setLimits(uint256 _start, uint256 _end) public onlyOwner {
    require(_start <= _end);
    end_ = _end;
    start_ = _start;
  }

  /**
   * @dev Allows the pending owner address to finalize the transfer, as long as it is called within
   * the specified start and end time.
   */
  function claimOwnership() public onlyPendingOwner {
    require((block.number <= end_) && (block.number >= start_));
    super.claimOwnership();
    end_ = 0;
  }

}
