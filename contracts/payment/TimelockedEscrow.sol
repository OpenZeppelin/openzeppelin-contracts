pragma solidity ^0.4.24;

import "./ConditionalEscrow.sol";


/**
 * @title TimelockedEscrow
 * @dev .
 */
contract TimelockedEscrow is ConditionalEscrow {

  uint256 public releaseTime;

  constructor (uint256 _releaseTime) public {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    releaseTime = _releaseTime;
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their funds.
  * @param _payee The destination address of the funds.
  */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);
    return true;
  }
}
