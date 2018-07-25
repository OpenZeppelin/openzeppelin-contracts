pragma solidity ^0.4.24;

import "../../introspection/SupportsInterfaceWithLookup.sol";


contract ERC165InterfaceSupported is SupportsInterfaceWithLookup {
  constructor (bytes4 _interfaceId)
    public
  {
    _registerInterface(_interfaceId);
  }
}
