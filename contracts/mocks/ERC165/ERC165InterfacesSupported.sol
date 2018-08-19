pragma solidity ^0.4.24;

import "../../introspection/SupportsInterfaceWithLookup.sol";


contract ERC165InterfacesSupported is SupportsInterfaceWithLookup {
  constructor (bytes4[] _interfaceIds)
    public
  {
    for (uint i = 0; i < _interfaceIds.length; i++) {
      _registerInterface(_interfaceIds[i]);
    }
  }
}
