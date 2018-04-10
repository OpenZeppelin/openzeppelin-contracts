pragma solidity ^0.4.21;


/**
 * @title LimitBalance
 * @dev Simple contract to limit the balance of child contract.
 * @dev Note this doesn't prevent other contracts to send funds by using selfdestruct(address);
 * @dev See: https://github.com/ConsenSys/smart-contract-best-practices#remember-that-ether-can-be-forcibly-sent-to-an-account
 */
contract LimitBalance {

  uint256 public limit;

  /**
   * @dev Constructor that sets the passed value as a limit.
   * @param _limit uint256 to represent the limit.
   */
  function LimitBalance(uint256 _limit) public {
    limit = _limit;
  }

  /**
   * @dev Checks if limit was reached. Case true, it throws.
   */
  modifier limitedPayable() {
    require(address(this).balance <= limit);
    _;

  }

}
