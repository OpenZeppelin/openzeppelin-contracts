pragma solidity ^0.4.23;

import "./ERC165.sol";


/**
 * @title SupportsInterfaceWithLookup
 * @author Matt Condon (@shrugs)
 * @dev Implements ERC165 using a lookup table.
 */
contract SupportsInterfaceWithLookup is ERC165 {
  /**
   * @dev a mapping of interface id to whether or not it's supported
   */
  mapping(bytes4 => bool) internal supportedInterfaces;

  /**
   * @dev A contract implementing SupportsInterfaceWithLookup
   * @dev  implement ERC165 itself (0x01ffc9a7)
   * @dev 0x01ffc9a7 === bytes4(keccak256('supportsInterface(bytes4)'));
   */
  constructor()
    public
  {
    // support ERC165 itself
    _registerInterface(0x01ffc9a7);
  }

  /**
   * @dev implement supportsInterface(bytes4) using a lookup table
   */
  function supportsInterface(bytes4 _interfaceId)
    external
    view
    returns (bool)
  {
    return supportedInterfaces[_interfaceId];
  }

  /**
   * @dev private method for registering an interface
   */
  function _registerInterface(bytes4 _interfaceId)
    internal
  {
    supportedInterfaces[_interfaceId] = true;
  }
}
