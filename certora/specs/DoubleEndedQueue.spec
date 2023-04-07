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
    return -(1 << 127);
}

function max_int128() returns mathint {
    return (1 << 127) - 1;
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
    empty() <=> length() == 0
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
rule pushFront(bytes32 value) {
    require boundedQueue();

    uint256 lengthBefore = length();
    
    pushFront@withrevert(value);
    
    // liveness
    assert !lastReverted, "never reverts";
    
    // effect
    assert front() == value, "front set to value";
    assert length() == lengthBefore + 1, "queue extended";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushFront preserves the previous values in the queue with a +1 offset                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFrontConsistency(uint256 index) {
    require boundedQueue();

    bytes32 beforeAt = at_(index);

    bytes32 value;
    pushFront(value);

    // try to read value
    bytes32 afterAt = at_@withrevert(index + 1);

    assert !lastReverted, "value still there";
    assert afterAt == beforeAt, "data is preserved";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushBack adds an element at the end of the queue                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBack(bytes32 value) {
    require boundedQueue();

    uint256 lengthBefore = length();
    
    pushBack@withrevert(value);
    
    // liveness
    assert !lastReverted, "never reverts";
    
    // effect
    assert back() == value, "back set to value";
    assert length() == lengthBefore + 1, "queue increased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushBack preserves the previous values in the queue                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBackConsistency(uint256 index) {
    require boundedQueue();

    bytes32 beforeAt = at_(index);

    bytes32 value;
    pushBack(value);

    // try to read value
    bytes32 afterAt = at_@withrevert(index);

    assert !lastReverted, "value still there";
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

    uint256 lengthBefore = length();
    bytes32 frontBefore = front@withrevert();

    bytes32 popped = popFront@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> lengthBefore != 0, "never reverts if not previously empty";

    // effect
    assert success => frontBefore == popped, "previous front is returned";
    assert success => length() == lengthBefore - 1, "queue decreased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved and offset to at(x - 1) after calling popFront                                             |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popFrontConsistency(uint256 index) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    // Read (any) value that is not the front (this asserts the value exists / the queue is long enough)
    require index > 1;
    bytes32 before = at_(index);

    popFront();

    // try to read value
    bytes32 after = at_@withrevert(index - 1);
    
    assert !lastReverted, "value still exists in the queue";
    assert before == after, "values are offset and not modified";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: popBack removes an element from the end of the queue                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBack {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    uint256 lengthBefore = length();
    bytes32 backBefore = back@withrevert();

    bytes32 popped = popBack@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> lengthBefore != 0, "never reverts if not previously empty";

    // effect
    assert success => backBefore == popped, "previous back is returned";
    assert success => length() == lengthBefore - 1, "queue decreased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved after calling popBack                                                                     |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBackConsistency(uint256 index) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    // Read (any) value that is not the back (this asserts the value exists / the queue is long enough)
    require index < length() - 1;
    bytes32 before = at_(index);

    popBack();

    // try to read value
    bytes32 after = at_@withrevert(index);
    
    assert !lastReverted, "value still exists in the queue";
    assert before == after, "values are offset and not modified";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: clear sets length to 0                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule clear {
    clear@withrevert();
    
    // liveness
    assert !lastReverted, "never reverts";
    
    // effect
    assert length() == 0, "sets length to 0";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: front/back access reverts only if the queue is empty or querying out of bounds                                │
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

    assert lastReverted => (
        (f.selector == front().selector && emptyBefore) ||
        (f.selector == back().selector && emptyBefore) ||
        (f.selector == popFront().selector  && emptyBefore) ||
        (f.selector == popBack().selector  && emptyBefore) ||
        f.selector == at_(uint256).selector // revert conditions are verified in onlyOutOfBoundsRevert
    ), "only revert if empty or out of bounds";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(index) only reverts if index is out of bounds                                                                  |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyOutOfBoundsRevert(uint256 index) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    at_@withrevert(index);

    assert lastReverted <=> index >= length(), "only reverts if index is out of bounds";
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
    f(e, args);
    uint256 lengthAfter = length();

    assert lengthAfter != lengthBefore => (
        (f.selector == pushFront(bytes32).selector && lengthAfter == lengthBefore + 1) ||
        (f.selector == pushBack(bytes32).selector && lengthAfter == lengthBefore + 1) ||
        (f.selector == popBack().selector && lengthAfter == lengthBefore - 1) ||
        (f.selector == popFront().selector && lengthAfter == lengthBefore - 1) ||
        (f.selector == clear().selector && lengthAfter == 0)
    ), "length is only affected by clear/pop/push operations";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only push/pop can change values bounded in the queue (outside values aren't cleared)                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDataChange(env e) {
    requireInvariant boundariesConsistency();
    require boundedQueue();

    method f;
    calldataarg args;

    uint256 index;
    bytes32 atBefore = at_(index);
    f(e, args);
    bytes32 atAfter = at_@withrevert(index);
    bool atAfterSuccess = !lastReverted;

    assert !atAfterSuccess <=> (
        f.selector == clear().selector ||
        (f.selector == popBack().selector && index == length()) ||
        (f.selector == popFront().selector && index == length())
    ), "indexes of the queue are only removed by clear or pop";

    assert atAfterSuccess && atAfter != atBefore => (
        f.selector == popFront().selector ||
        f.selector == pushFront(bytes32).selector
    ), "values of the queue are only changed by popFront or pushFront";
}
