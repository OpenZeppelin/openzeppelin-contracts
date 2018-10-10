pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./Escrow.sol";


/**
 * @title ConditionalEscrow
 * @dev Base abstract escrow to only allow withdrawal if a condition is met.
 */
contract ConditionalEscrow is Initializable, Escrow {
  function initialize(address sender) public initializer {
    Escrow.initialize(sender);
  }

  /**
  * @dev Returns whether an address is allowed to withdraw their funds. To be
  * implemented by derived contracts.
  * @param payee The destination address of the funds.
  */
  function withdrawalAllowed(address payee) public view returns (bool);

  function withdraw(address payee) public {
    require(withdrawalAllowed(payee));
    super.withdraw(payee);
  }

  uint256[50] private ______gap;
}
