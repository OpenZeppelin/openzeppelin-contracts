pragma solidity ^0.4.24;

import "../AutoIncrementing.sol";


contract AutoIncrementingImpl is AutoIncrementing {
  uint256 public theId;

  function doThing()
    public
    returns (uint256)
  {
    theId = nextId();
    return theId;
  }
}
