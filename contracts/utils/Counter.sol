pragma solidity ^0.5.0;

import "../math/SafeMath.sol";

/**
 * @title Counter
 * @author Matt Condon (@shrugs)
 * @dev Provides an incrementing uint256 id acquired by the `Counter#next` getter.
 * Use this for issuing ERC721 ids or keeping track of request ids, anything you want, really.
 *
 * Include with `using Counter for Counter.Counter;`
 * @notice Does not allow an Id of 0, which is popularly used to signify a null state in solidity.
 * Does not protect from overflows, but if you have 2^256 ids, you have other problems.
 * (But actually, it's generally impossible to increment a counter this many times, energy wise
 * so it's not something you have to worry about.)
 */
library Counter {
    using SafeMath for uint256;

    struct Counter {
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        counter._value += 1;
    }

    function decrement(Counter storage counter) internal {
        counter._value = counter._value.sub(1);
    }
}
