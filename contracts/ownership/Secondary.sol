pragma solidity ^0.4.24;


/**
 * @title Secondary
 * @dev A Secondary contract can only be used by its primary account (the one that created it)
 */
contract Secondary {
  address public primary;

  /**
   * @dev Sets the primary account to the one that is creating the Secondary contract.
   */
  constructor() public {
    primary = msg.sender;
  }

  /**
   * @dev Reverts if called from any account other than the primary.
   */
  modifier onlyPrimary() {
    require(msg.sender == primary);
    _;
  }
}
