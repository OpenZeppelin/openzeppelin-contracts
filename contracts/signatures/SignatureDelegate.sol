pragma solidity 0.4.24;

import "./ISignatureDelegate.sol";
import "../introspection/SupportsInterfaceWithLookup.sol";


/**
 * @title SignatureDelegate
 * @dev Partial implementation of ISignatureDelegate that adds ERC165 support
 * But you as the developer still have to add your signature validation logic.
 * As a delegate, you must proxy calls from accounts you consider valid.
 */
contract SignatureDelegate is ISignatureDelegate, SupportsInterfaceWithLookup {
  constructor ()
    public
  {
    _registerInterface(InterfaceId_SignatureDelegate);
  }
}
