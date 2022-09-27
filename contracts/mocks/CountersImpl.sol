// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Counters.sol";

contract CountersImpl {
    using Counters for Counters.Counter;

    Counters.Counter private _counter;
    uint256 public helper;

    function current() public view returns (uint256) {
        return _counter.current();
    }

    function increment() public {
        _counter.increment();
    }

    function decrement() public {
        _counter.decrement();
    }

    function getAndIncrement() public {
        helper = _counter.getAndIncrement();
    }

    function incrementAndGet() public {
        helper = _counter.incrementAndGet();
    }

    function getAndDecrement() public {
        helper = _counter.getAndDecrement();
    }

    function decrementAndGet() public {
        helper = _counter.decrementAndGet();
    }

    function reset() public {
        _counter.reset();
    }
}
