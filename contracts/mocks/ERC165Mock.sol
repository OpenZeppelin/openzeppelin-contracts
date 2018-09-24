pragma solidity ^0.4.24;

import "../introspection/ERC165.sol";


contract ERC165Mock is ERC165 {
  constructor() public {
    ERC165.initialize();
  }

  function registerInterface(bytes4 interfaceId)
    public
  {
    _registerInterface(interfaceId);
  }
}
