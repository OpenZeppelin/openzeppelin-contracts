pragma solidity ^0.4.24;

import "../access/rbac/Roles.sol";


contract RolesMock {
  using Roles for Roles.Role;

  Roles.Role private dummyRole;

  function add(address _account) public {
    dummyRole.add(_account);
  }

  function addMany(address[] _accounts) public {
    dummyRole.addMany(_accounts);
  }

  function remove(address _account) public {
    dummyRole.remove(_account);
  }

  function transfer(address _account) public {
    dummyRole.transfer(_account);
  }

  function check(address _account) public view {
    dummyRole.check(_account);
  }

  function has(address _account) public view returns (bool) {
    return dummyRole.has(_account);
  }
}
