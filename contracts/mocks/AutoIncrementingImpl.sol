pragma solidity ^0.4.24;

import "../utils/AutoIncrementing.sol";


contract AutoIncrementingImpl {
  using AutoIncrementing for AutoIncrementing.Counter;

  uint256 public theId;

  // use whatever key you want to track your counters
  mapping(string => AutoIncrementing.Counter) private _counters;

  function doThing(string key)
    public
    returns (uint256)
  {
    theId = _counters[key].nextId();
    return theId;
  }
}
