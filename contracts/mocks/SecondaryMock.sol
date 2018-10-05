pragma solidity ^0.4.24;

import "../ownership/Secondary.sol";


contract SecondaryMock is Secondary {
  constructor() public {
    Secondary.initialize(msg.sender);
  }

  function onlyPrimaryMock() public view onlyPrimary {
  }
}
