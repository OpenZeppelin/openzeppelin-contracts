// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Counters.sol";

contract CountersImpl {
    using Counters for Counters.Counter;

    Counters.Counter private _counter;

    event ReturnedValue(uint256 value);

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
        uint256 value = _counter.getAndIncrement();
        emit ReturnedValue(value);
    }

    function incrementAndGet() public {
        uint256 value = _counter.incrementAndGet();
        emit ReturnedValue(value);
    }

    function getAndDecrement() public {
        uint256 value = _counter.getAndDecrement();
        emit ReturnedValue(value);
    }

    function decrementAndGet() public {
        uint256 value = _counter.decrementAndGet();
        emit ReturnedValue(value);
    }

    function reset() public {
        _counter.reset();
    }
}
