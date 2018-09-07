pragma solidity ^0.4.24;

import "../access/Roles.sol";


contract RolesMock {
  using Roles for Roles.Role;

  Roles.Role private dummyRole;

  function add(address _account) public {
    dummyRole.add(_account);
  }

  function remove(address _account) public {
    dummyRole.remove(_account);
  }

  function has(address _account) public view returns (bool) {
    return dummyRole.has(_account);
  }
}
