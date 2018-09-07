pragma solidity ^0.4.24;


/**
 * @title Secondary
 * @dev A Secondary contract can only be used by its primary account (the one that created it)
 */
contract Secondary {
  address private _primary;

  /**
   * @dev Sets the primary account to the one that is creating the Secondary contract.
   */
  constructor() public {
    _primary = msg.sender;
  }

  /**
   * @dev Reverts if called from any account other than the primary.
   */
  modifier onlyPrimary() {
    require(msg.sender == _primary);
    _;
  }

  function primary() public view returns (address) {
    return _primary;
  }

  function transferPrimary(address recipient) public onlyPrimary {
    require(recipient != address(0));

    _primary = recipient;
  }
}
