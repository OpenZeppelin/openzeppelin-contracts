pragma solidity ^0.4.24;

import "../AutoIncrementing.sol";


contract AutoIncrementingImpl is AutoIncrementing {
  uint256 public theId;

  function doThingWithDefault()
    public
    returns (uint256)
  {
    theId = nextId(DEFAULT_COUNTER);
    return theId;
  }

  function doThing(bytes32 _key)
    public
    returns (uint256)
  {
    theId = nextId(_key);
    return theId;
  }
}
