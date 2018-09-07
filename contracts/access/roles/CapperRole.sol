pragma solidity ^0.4.24;

import "../Roles.sol";


contract CapperRole {
  using Roles for Roles.Role;

  Roles.Role private cappers;

  constructor() public {
    cappers.add(msg.sender);
  }

  modifier onlyCapper() {
    require(isCapper(msg.sender));
    _;
  }

  function isCapper(address account) public view returns (bool) {
    return cappers.has(account);
  }

  function addCapper(address account) public onlyCapper {
    cappers.add(account);
  }

  function renounceCapper() public {
    cappers.remove(msg.sender);
  }

  function _removeCapper(address account) internal {
    cappers.remove(account);
  }
}
