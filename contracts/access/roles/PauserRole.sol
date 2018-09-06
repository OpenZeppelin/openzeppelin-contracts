pragma solidity ^0.4.24;

import "../Roles.sol";


contract PauserRole {
  using Roles for Roles.Role;

  Roles.Role private pausers;

  constructor() public {
    pausers.add(msg.sender);
  }

  modifier onlyPauser() {
    require(isPauser(msg.sender));
    _;
  }

  function isPauser(address _account) public view returns (bool) {
    return pausers.has(_account);
  }

  function addPauser(address _account) public onlyPauser {
    pausers.add(_account);
  }

  function renouncePauser() public {
    pausers.remove(msg.sender);
  }

  function _removePauser(address _account) internal {
    pausers.remove(_account);
  }
}
