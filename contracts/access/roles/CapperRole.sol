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

  function isCapper(address _account) public view returns (bool) {
    return cappers.has(_account);
  }

  function addCapper(address _account) public onlyCapper {
    cappers.add(_account);
  }

  function renounceCapper() public {
    cappers.remove(msg.sender);
  }

  function _removeCapper(address _account) internal {
    cappers.remove(_account);
  }
}
