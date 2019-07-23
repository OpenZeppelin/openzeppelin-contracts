pragma solidity ^0.5.0;

/**
 * @dev The {IERC165} interface.
 *
 * Contracts may inherit from this and call {_registerInterface} to declare
 * their support of an interface.
 */
contract IERC2135 {
  // The main consume function
  function consume(uint256 assetId) public returns(bool success);

  // The interface to check whether an asset is consumable.
  function isConsumable(uint256 assetId) public view returns (bool consumable);

  // The interface to check whether an asset is consumable.
  event OnConsumption(uint256 indexed assetId);
}
