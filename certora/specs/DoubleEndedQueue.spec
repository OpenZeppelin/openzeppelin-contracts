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

function min_int128() returns mathint {
    return (2 ^ 128) / 2 * -1;
}

function max_int128() returns mathint {
    return (2 ^ 128) / 2 - 1;
}

// Could be broken in theory, but not in practice
function boundedQueue() returns bool {
    return 
        max_int128() > to_mathint(end()) &&
        min_int128() < to_mathint(begin());
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: end is larger or equal than begin                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant boundariesConsistency()
    end() >= begin()
    filtered { f -> !f.isView }
    { preserved { require boundedQueue(); } }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: length is end minus begin                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant lengthConsistency()
    length() == to_mathint(end()) - to_mathint(begin())
    filtered { f -> !f.isView }
    { preserved { require boundedQueue(); } }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: empty() is length 0 and no element exists                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant emptiness()
    empty() <=> (length() == 0 && begin() == end())
    filtered { f -> !f.isView }
    { preserved { require boundedQueue(); } }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: front points to the first index and back points to the last one                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant queueEndings()
    at_(length() - 1) == back() && at_(0) == front()
    filtered { f -> !f.isView }
    { 
        preserved { 
            requireInvariant boundariesConsistency(); 
            require boundedQueue(); 
        } 
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushFront adds an element at the beginning of the queue                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFront {
    require boundedQueue();
    
    bytes32 value;

    bytes32 frontBefore = front();

    pushFront@withrevert(value);
    bool success = !lastReverted;

    bytes32 frontAfter = front();

    // liveness
    assert success, "never reverts";

    // effect
    assert success => frontAfter == value, "front set to value";

    // no side effect
    assert frontBefore == frontAfter <=> frontBefore == value, "front doesn't change only if it was already set";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushFront preserves the previous values in the queue with a +1 offset                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFrontConsistency {
    require boundedQueue();

    uint256 key;
    bytes32 beforeAt = at_(key);

    bytes32 value;
    pushFront@withrevert(value);

    bytes32 afterAt = at_(key + 1);

    assert afterAt == beforeAt, "data is preserved";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushBack adds an element at the end of the queue                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBack {
    require boundedQueue();

    bytes32 value;

    bytes32 backBefore = back();

    pushBack@withrevert(value);
    bool success = !lastReverted;

    bytes32 backAfter = back();

    // liveness
    assert success, "never reverts";

    // effect
    assert success => backAfter == value, "back set to value";

    // no side effect
    assert backBefore == backAfter <=> backBefore == value, "back doesn't change only if it was already set";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushBack preserves the previous values in the queue                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBackConsistency {
    require boundedQueue();

    uint256 key;
    bytes32 beforeAt = at_(key);

    bytes32 value;
    pushBack@withrevert(value);

    bytes32 afterAt = at_(key);

    assert afterAt == beforeAt, "data is preserved";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: popFront removes an element from the beginning of the queue                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popFront {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    bool emptyBefore = empty();
    bytes32 frontBefore = front@withrevert();

    bytes32 popped = popFront@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> !emptyBefore, "only fails if it's empty";

    // effect
    assert success => frontBefore == popped, "previous front is returned";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: front is previous at(1) after calling popFront                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popFrontExpected {
    requireInvariant boundariesConsistency();
    require boundedQueue();
    
    bytes32 nextFront = at_(1);
    popFront@withrevert();

    assert !lastReverted <=> front() == nextFront, "front is adjusted";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved and offset to at(x - 1) after calling popFront                                             |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popFrontConsistency {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    uint256 key;
    bytes32 before = at_(key);

    popFront@withrevert();
    bool success = !lastReverted;
    
    assert !lastReverted <=> before == at_(key - 1), "values are offset and not modified";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: popBack removes an element from the end of the queue                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBack {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    bool emptyBefore = empty();
    bytes32 backBefore = back@withrevert();

    bytes32 popped = popBack@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> !emptyBefore, "only fails if it's empty";

    // effect
    assert success => backBefore == popped, "previous back is returned";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: back is previous at(length - 2) after calling popBack                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBackExpected {
    requireInvariant boundariesConsistency();
    require boundedQueue();
    
    bytes32 nextBack = at_(length() - 2);
    popBack@withrevert();

    assert !lastReverted => back() == nextBack, "back is adjusted";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved after calling popBack                                                                     |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBackConsistency {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    uint256 key;
    bytes32 before = at_(key);

    popBack@withrevert();
    bool success = !lastReverted;
    
    assert !lastReverted <=> before == at_(key), "values are not modified";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: clear sets length to 0                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule clear {
    clear@withrevert();
    bool success = !lastReverted;
    
    // liveness
    assert success, "never reverts";
    
    // effect
    assert success <=> length() == 0, "sets length to 0";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: front/back access reverts only if the queue is empty                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyEmptyRevert(env e) {
    require nonpayable(e);
    requireInvariant boundariesConsistency();
    require boundedQueue();

    method f;
    calldataarg args;

    bool emptyBefore = empty();

    f@withrevert(e, args);
    bool success = !lastReverted;

    assert !success && (
        f.selector == front().selector ||
        f.selector == back().selector ||
        f.selector == popFront().selector ||
        f.selector == popBack().selector
    ) => emptyBefore, "only revert if empty";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(key) only reverts if key is out of bounds                                                                  |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyOutOfBoundsRevert(env e) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    uint256 key;

    at_@withrevert(key);
    bool success = !lastReverted;

    assert success <=> key < length(), "only reverts if key is out of bounds";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only clear/push/pop operations can change the length of the queue                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noLengthChange(env e) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    method f;
    calldataarg args;

    uint256 lengthBefore = length();
    f@withrevert(e, args);
    uint256 lengthAfter = length();

    assert lengthAfter > lengthBefore => (
        f.selector == pushFront(bytes32).selector ||
        f.selector == pushBack(bytes32).selector
    ), "length increases only with push operations";
    
    assert lengthAfter < lengthBefore => (
        f.selector == popBack().selector ||
        f.selector == popFront().selector ||
        f.selector == clear().selector
    ), "length decreases only with clear/pop operations";

    assert (
        lengthAfter - lengthBefore != 1 &&
        lengthAfter - lengthBefore == 1
    ) => (
        f.selector == clear().selector
    ), "length changes by more than one only with clear operations";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only push/pop can change the value of the values bounded in the queue (outters aren't be cleared)             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDataChange(env e) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    method f;
    calldataarg args;

    uint256 key;
    bytes32 atBefore = at_(key);
    f@withrevert(e, args);
    bytes32 atAfter = at_(key);

    assert atAfter != atBefore => (
        f.selector == clear().selector || // Although doesn't change values, outters are symbolic, so `* != *`
        f.selector == popBack().selector ||
        f.selector == popFront().selector ||
        f.selector == pushBack(bytes32).selector ||
        f.selector == pushFront(bytes32).selector
    ), "values of the queue are only changed by a clear, pop or push operation";
}
