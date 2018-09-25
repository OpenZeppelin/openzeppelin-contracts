pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../ownership/Secondary.sol";


contract SecondaryMock is Initializable, Secondary {
  constructor() public {
    Secondary.initialize();
  }

  function onlyPrimaryMock() public view onlyPrimary {
  }
}
