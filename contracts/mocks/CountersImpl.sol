pragma solidity ^0.5.0;

import "../drafts/Counters.sol";

contract CountersImpl {
    using Counters for Counters.Counter;

    Counters.Counter private _counter;

    function current() public view returns (uint256) {
        return _counter.current();
    }

    function increment() public {
        _counter.increment();
    }

    function decrement() public {
        _counter.decrement();
    }
}
