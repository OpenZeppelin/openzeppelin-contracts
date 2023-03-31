import "helpers.spec"

methods {
    pushFront(bytes32)                    envfree
    pushBack(bytes32)                     envfree
    popFront()          returns (bytes32) envfree
    popBack()           returns (bytes32) envfree
    clear()                               envfree

    // exposed for FV
    begin()             returns (int128)  envfree
    end()               returns (int128)  envfree
    
    // view
    length()            returns (uint256) envfree
    empty()             returns (bool)    envfree
    front()             returns (bytes32) envfree
    back()              returns (bytes32) envfree
    at_(uint256)        returns (bytes32) envfree // at is a reserved word
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

function absolute_diff(mathint a, mathint b) returns mathint {
    return a > b ? a - b : b - a; 
}

function min_int128() returns mathint {
    return max_uint256 / 2 + 1;
}

function max_int128() returns mathint {
    return max_uint256 / 2;
}

// Could be broken in theory, but not in practice
function beginLimited(int128 begin) returns bool {
    return min_int128() < to_mathint(begin); // not inclusive so it can pushFront
}

// Could be broken in theory, but not in practice
function endLimited(int128 end) returns bool {
    return max_int128() > to_mathint(end); // not inclusive so it can pushBack
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: end is larger or equal than begin if values are safely assumed not to overflow.                          │
| NOTE: This assumption make the proofs unsound, but they can't realistically overflow                                |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant boundariesConsistency()
    end() >= begin()
    {
        preserved {
            require beginLimited(begin());
            require endLimited(end());
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: length is end minus begin                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant lengthConsistency()
    length() == absolute_diff(to_mathint(end()), to_mathint(begin()))
    {
        preserved {
            requireInvariant boundariesConsistency;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: out of bounds is always 0                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant outOfBoundsDefault(int128 key)
    key < begin() && key >= end() && at_(to_uint256(key)) == 0

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushFront adds an element at the beginning of the queue                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFront {
    requireInvariant boundariesConsistency;

    bytes32 value;

    int128 beginBefore = begin();
    int128 beginNext = beginBefore - 1;

    bytes32 valueBefore = at_(0);

    pushFront@withrevert(value);

    int128 beginAfter = begin();
    bytes32 valueAfter = at_(0);

    bool success = !lastReverted;

    // liveness
    assert success;

    // effect
    assert success => valueAfter == value && beginAfter == beginNext, "value set, and begin adjusted";

    // no side effect
    assert valueBefore == valueAfter => valueBefore == value, "value doesn't change only if it was already set";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushBack adds an element at the end of the queue                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBack {
    requireInvariant boundariesConsistency;

    bytes32 value;

    int128 endBefore = end();
    int128 endNext = endBefore + 1;
    
    bytes32 valueBefore = at_(to_uint256(end() - 1));

    pushBack@withrevert(value);

    int128 endAfter = end();
    bytes32 valueAfter = at_(to_uint256(end() - 1));

    bool success = !lastReverted;

    // liveness
    assert success;

    // effect
    assert success => valueAfter == value && endAfter == endNext, "value set, and end adjusted";

    // no side effect
    assert valueBefore == valueAfter => valueBefore == value, "value doesn't change only if it was already set";
}

