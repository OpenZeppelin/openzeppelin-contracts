pragma solidity ^0.4.24;

/**
 * @title Secondary
 * @dev A Secondary contract can only be used by its primary account (the one that created it)
 */
contract Secondary {
  address private _primary;

  event PrimarinessTransferred(
    address indexed recipient
  );

  /**
   * @dev Sets the primary account to the one that is creating the Secondary contract.
   */
  constructor() public {
    _primary = msg.sender;
    emit PrimarinessTransferred(_primary);
  }

  /**
   * @dev Reverts if called from any account other than the primary.
   */
  modifier onlyPrimary() {
    require(msg.sender == _primary);
    _;
  }

  /**
   * @return the address of the primary.
   */
  function primary() public view returns (address) {
    return _primary;
  }
  
  /**
   * @dev Transfers primariness to a recipient.
   * @param recipient The address to transfer primariness. 
   */
  function transferPrimary(address recipient) public onlyPrimary {
    require(recipient != address(0));
    _primary = recipient;
    emit PrimarinessTransferred(_primary);
  }
}
