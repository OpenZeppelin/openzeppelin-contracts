pragma solidity ^0.4.24;

import "./ConditionalEscrow.sol";


/**
 * @title TimelockedEscrow
 * @dev Escrow that holds funds for given amount of time,
 * preventing their withdrawal until the time has passed.
 */
contract TimelockedEscrow is ConditionalEscrow {
  // In seconds since unix epoch
  uint256 public releaseTime;

  /**
   * @dev Constructor.
   * @param _releaseTime Time when the funds will be available for withdrawal.
   */
  constructor(uint256 _releaseTime) public {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    releaseTime = _releaseTime;
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their funds.
  */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= releaseTime;
  }
}
