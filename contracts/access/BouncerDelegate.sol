pragma solidity 0.4.24;

import "./IBouncerDelegate.sol";
import "../introspection/SupportsInterfaceWithLookup.sol";


/**
 * @title BouncerDelegate
 * @dev Partial implementation of IBouncerDelegate that adds ERC165 support
 * But you as the developer still have to add your signature validation logic.
 * As a delegate, you must proxy calls from accounts you consider valid.
 */
contract BouncerDelegate is IBouncerDelegate, SupportsInterfaceWithLookup {
  constructor ()
    public
  {
    _registerInterface(InterfaceId_BouncerDelegate);
  }
}
