pragma solidity ^0.6.0;

import "../utils/Counter.sol";

contract CounterImpl {
    using Counter for Counter.Counter;

    Counter.Counter private _counter;

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
