pragma solidity ^0.4.24;

import "../access/roles/SignerRole.sol";


contract SignerRoleMock is SignerRole {
  function removeSigner(address _account) public {
    _removeSigner(_account);
  }

  function onlySignerMock() public view onlySigner {
  }

  // Causes a compilation error if super._removeSigner is not internal
  function _removeSigner(address _account) internal {
    super._removeSigner(_account);
  }
}
