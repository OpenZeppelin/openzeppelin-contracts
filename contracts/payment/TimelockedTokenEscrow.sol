pragma solidity ^0.4.24;

import "./ConditionalTokenEscrow.sol";


/**
 * @title TimelockedTokenEscrow
 * @dev Escrow that holds tokens for given amount of time,
 * preventing their whithdrawal until the time has passed.
 */
contract TimelockedTokenEscrow is ConditionalTokenEscrow {

  uint256 public releaseTime;

  /**
   * @dev Constructor.
   * @param _token Address of the ERC20 token that will be put in escrow.
   * @param _releaseTime Time when the tokens will be available for withdrawal.
   */
  constructor (ERC20 _token, uint256 _releaseTime) public TokenEscrow(_token) {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    releaseTime = _releaseTime;
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their funds.
  */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);
    return true;
  }
}
