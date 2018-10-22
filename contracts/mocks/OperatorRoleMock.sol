pragma solidity ^0.4.24;

import "../access/roles/OperatorRole.sol";

contract OperatorRoleMock is OperatorRole {
  function removeOperator(address account) public {
    _removeOperator(account);
  }

  function onlyOperatorMock() public view onlyOperator {
  }

  // Causes a compilation error if super._removeOperator is not internal
  function _removeOperator(address account) internal {
    super._removeOperator(account);
  }
}
