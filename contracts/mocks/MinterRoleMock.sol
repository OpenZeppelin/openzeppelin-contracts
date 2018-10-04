pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../access/roles/MinterRole.sol";


contract MinterRoleMock is Initializable, MinterRole {
  constructor() public {
    MinterRole.initialize();
  }

  function removeMinter(address account) public {
    _removeMinter(account);
  }

  function onlyMinterMock() public view onlyMinter {
  }

  // Causes a compilation error if super._removeMinter is not internal
  function _removeMinter(address account) internal {
    super._removeMinter(account);
  }
}
