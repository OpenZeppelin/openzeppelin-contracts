pragma solidity ^0.5.2;

import "../drafts/Counters.sol";

contract CountersImpl {
    using Counters for Counters.Counter;

    uint256 public theId;

    // use whatever key you want to track your counters
    mapping(string => Counters.Counter) private _counters;

    function doThing(string memory key) public returns (uint256) {
        theId = _counters[key].next();
        return theId;
    }
}
