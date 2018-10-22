pragma solidity ^0.4.24;

/**
 * @title Secondary
 * @dev A Secondary contract can only be used by its primary account (the one that created it)
 */
contract Secondary {
  address private _primary;

  event PrimaryTransferred(
    address recipient
  );

  /**
   * @dev Sets the primary account to the one that is creating the Secondary contract.
   */
  constructor() internal {
    _primary = msg.sender;
    emit PrimaryTransferred(_primary);
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
   * @dev Transfers contract to a new primary.
   * @param recipient The address of new primary. 
   */
  function transferPrimary(address recipient) public onlyPrimary {
    require(recipient != address(0));
    _primary = recipient;
    emit PrimaryTransferred(_primary);
  }
}
