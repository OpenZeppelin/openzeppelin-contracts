pragma solidity ^0.4.24;

import "../access/roles/MinterRole.sol";


contract MinterRoleMock is MinterRole {
  function removeMinter(address _account) public {
    _removeMinter(_account);
  }

  function onlyMinterMock() public view onlyMinter {
  }

  // Causes a compilation error if super._removeMinter is not internal
  function _removeMinter(address _account) internal {
    super._removeMinter(_account);
  }
}
