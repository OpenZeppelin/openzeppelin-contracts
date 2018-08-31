pragma solidity ^0.4.24;

import "./ConditionalTokenEscrow.sol";


/**
 * @title TimelockedTokenEscrow
 * @dev .
 */
contract TimelockedTokenEscrow is ConditionalTokenEscrow {

  uint256 public releaseTime;

  constructor (ERC20 _token, uint256 _releaseTime) public TokenEscrow(_token) {
    // solium-disable-next-line security/no-block-members
    require(_releaseTime > block.timestamp);
    releaseTime = _releaseTime;
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their funds.
  * @param _payee The destination address of the tokens.
  */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= releaseTime);
    return true;
  }
}
