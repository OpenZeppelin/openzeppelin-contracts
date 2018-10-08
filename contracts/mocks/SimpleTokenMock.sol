pragma solidity ^0.4.24;

import "../examples/SimpleToken.sol";

contract SimpleTokenMock is SimpleToken {
  constructor() public {
    SimpleToken.initialize(msg.sender);
  }
}
