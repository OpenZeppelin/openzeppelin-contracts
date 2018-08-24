pragma solidity ^0.4.24;

import "./Roles.sol";

contract MinterRole {
  using Roles for Roles.Role;

  Roles.Role private minters;

  constructor(address[] _minters) public {
    minters.addMany(_minters);
  }

  function addMinter(address _account) internal {
    minters.add(_account);
  }

  function removeMinter(address _account) internal {
    minters.remove(_account);
  }

  function transferMinterRole(address _account) public {
    minters.transfer(_account);
  }

  function isMinter(address _account) public view returns (bool) {
    return minters.has(_account);
  }

  modifier onlyMinter() {
    require(isMinter(msg.sender));
    _;
  }
}
