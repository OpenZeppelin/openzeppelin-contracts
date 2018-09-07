pragma solidity ^0.4.24;

import "../utils/Counter.sol";


contract CounterImpl {
  using Counter for Counter.Index;

  uint256 public theId;

  // use whatever key you want to track your counters
  mapping(string => Counter.Index) private _counters;

  function doThing(string key)
    public
    returns (uint256)
  {
    theId = _counters[key].next();
    return theId;
  }
}
