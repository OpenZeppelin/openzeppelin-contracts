pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Capped.sol";
import "./MinterRoleMock.sol";


contract ERC20CappedMock is ERC20Capped, MinterRoleMock {

  constructor(uint256 cap) public {
    ERC20Capped.initialize(cap, msg.sender);
  }

}
