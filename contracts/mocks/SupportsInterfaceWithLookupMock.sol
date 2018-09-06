pragma solidity ^0.4.24;

import "../introspection/SupportsInterfaceWithLookup.sol";


contract ERC165Mock is ERC165 {
  function registerInterface(bytes4 _interfaceId)
    public
  {
    _registerInterface(_interfaceId);
  }
}
