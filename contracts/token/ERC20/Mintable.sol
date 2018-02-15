pragma solidity ^0.4.18;


/**
 * @title Mintable
 * @dev Interface for mintable token contracts
 */
contract Mintable {
  function mint(address _to, uint256 _amount) public returns (bool);
}
