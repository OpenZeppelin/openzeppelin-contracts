pragma solidity ^0.4.24;

import "../access/roles/CapperRole.sol";


contract CapperRoleMock is CapperRole {
  function removeCapper(address _account) public {
    _removeCapper(_account);
  }

  function onlyCapperMock() public view onlyCapper {
  }

  // Causes a compilation error if super._removeCapper is not internal
  function _removeCapper(address _account) internal {
    super._removeCapper(_account);
  }
}
