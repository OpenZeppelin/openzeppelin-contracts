pragma solidity ^0.4.24;

import "../introspection/SupportsInterfaceWithLookup.sol";


contract SupportsInterfaceWithLookupMock is SupportsInterfaceWithLookup {
  function registerInterface(bytes4 _interfaceId)
    public
  {
    _registerInterface(_interfaceId);
  }
}
