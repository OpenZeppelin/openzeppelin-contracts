pragma solidity ^0.4.23;

import "../introspection/SupportsInterfaceWithLookup.sol";


contract SupportsInterfaceWithLookupMock is SupportsInterfaceWithLookup {
  function registerInterface(bytes4 _interfaceId)
    public
  {
    _registerInterface(_interfaceId);
  }
}
