pragma solidity ^0.5.0;

import "../drafts/Counter.sol";

contract CounterImpl {
    using Counter for Counter.Counter;

    Counter.Counter private _counter;
    event ValueChange(uint256 current);

    function current() public view returns (uint256) {
        return _counter.current();
    }

    function increment() public {
        emit ValueChange(_counter.increment());
    }

    function decrement() public {
        emit ValueChange(_counter.decrement());
    }
}
