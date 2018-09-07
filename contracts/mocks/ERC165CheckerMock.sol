pragma solidity ^0.4.24;

import "../introspection/ERC165Checker.sol";


contract ERC165CheckerMock {
  using ERC165Checker for address;

  function supportsERC165(address account)
    public
    view
    returns (bool)
  {
    return account.supportsERC165();
  }

  function supportsInterface(address account, bytes4 interfaceId)
    public
    view
    returns (bool)
  {
    return account.supportsInterface(interfaceId);
  }

  function supportsInterfaces(address account, bytes4[] interfaceIds)
    public
    view
    returns (bool)
  {
    return account.supportsInterfaces(interfaceIds);
  }
}
