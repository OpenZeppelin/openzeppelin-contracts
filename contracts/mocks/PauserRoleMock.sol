pragma solidity ^0.4.24;

import "../access/rbac/PauserRole.sol";


contract PauserRoleMock is PauserRole {
  // Causes a compilation error if super._removePauser is not internal
  function _removePauser(address _account) internal {
      super._removePauser(_account);
  }

  function removePauser(address _account) public {
    _removePauser(_account);
  }

  function onlyPauserMock() public view onlyPauser {
  }
}
