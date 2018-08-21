pragma solidity ^0.4.24;

import "../introspection/ERC165Checker.sol";


contract ERC165CheckerMock {
  using ERC165Checker for address;

  function supportsERC165(address _address)
    public
    view
    returns (bool)
  {
    return _address.supportsERC165();
  }

  function supportsInterface(address _address, bytes4 _interfaceId)
    public
    view
    returns (bool)
  {
    return _address.supportsInterface(_interfaceId);
  }

  function supportsInterfaces(address _address, bytes4[] _interfaceIds)
    public
    view
    returns (bool)
  {
    return _address.supportsInterfaces(_interfaceIds);
  }
}
