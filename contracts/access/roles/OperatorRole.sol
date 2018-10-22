pragma solidity ^0.4.24;

import "../Roles.sol";

contract OperatorRole {
  using Roles for Roles.Role;

  event OperatorAdded(address indexed account);
  event OperatorRemoved(address indexed account);

  Roles.Role private operators;

  constructor() internal {
    _addOperator(msg.sender);
  }

  modifier onlyOperator() {
    require(isOperator(msg.sender));
    _;
  }

  function isOperator(address account) public view returns (bool) {
    return operators.has(account);
  }

  function addOperator(address account) public onlyOperator {
    _addOperator(account);
  }

  function renounceOperator() public {
    _removeOperator(msg.sender);
  }

  function _addOperator(address account) internal {
    operators.add(account);
    emit OperatorAdded(account);
  }

  function _removeOperator(address account) internal {
    operators.remove(account);
    emit OperatorRemoved(account);
  }
}
