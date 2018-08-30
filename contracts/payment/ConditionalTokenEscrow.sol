pragma solidity ^0.4.24;

import "./TokenEscrow.sol";


/**
 * @title ConditionalTokenEscrow
 * @dev Base abstract escrow to only allow withdrawal if a condition is met.
 */
contract ConditionalTokenEscrow is TokenEscrow {
  /**
  * @dev Returns whether an address is allowed to withdraw their tokens. To be
  * implemented by derived contracts.
  * @param _payee The destination address of the tokens.
  */
  function withdrawalAllowed(address _payee) public view returns (bool);

  function withdraw(address _payee) public {
    require(withdrawalAllowed(_payee));
    super.withdraw(_payee);
  }
}
