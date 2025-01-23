import "helpers/helpers.spec";

methods {
    function pushFront(bytes32) external                   envfree;
    function pushBack(bytes32)                    external envfree;
    function popFront()         external returns (bytes32) envfree;
    function popBack()          external returns (bytes32) envfree;
    function clear()            external                   envfree;

    // exposed for FV
    function begin()            external returns (uint128) envfree;
    function end()              external returns (uint128) envfree;

    // view
    function length()           external returns (uint256) envfree;
    function empty()            external returns (bool)    envfree;
    function front()            external returns (bytes32) envfree;
    function back()             external returns (bytes32) envfree;
    function at_(uint256)       external returns (bytes32) envfree; // at is a reserved word
}

definition full() returns bool = length() == max_uint128;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: empty() is length 0 and no element exists                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant emptiness()
    empty() <=> length() == 0
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: front points to the first index and back points to the last one                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant queueFront()
    at_(0) == front()
    filtered { f -> !f.isView }

invariant queueBack()
    at_(require_uint256(length() - 1)) == back()
    filtered { f -> !f.isView }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushFront adds an element at the beginning of the queue                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFront(bytes32 value) {
    uint256 lengthBefore = length();
    bool    fullBefore   = full();

    pushFront@withrevert(value);
    bool success = !lastReverted;

    // liveness
    assert success <=> !fullBefore, "never revert if not previously full";

    // effect
    assert success => front() == value, "front set to value";
    assert success => to_mathint(length()) == lengthBefore + 1, "queue extended";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushFront preserves the previous values in the queue with a +1 offset                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushFrontConsistency(uint256 index) {
    bytes32 beforeAt = at_(index);

    bytes32 value;
    pushFront(value);

    // try to read value
    bytes32 afterAt = at_@withrevert(require_uint256(index + 1));

    assert !lastReverted, "value still there";
    assert afterAt == beforeAt, "data is preserved";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: pushBack adds an element at the end of the queue                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBack(bytes32 value) {
    uint256 lengthBefore = length();
    bool    fullBefore   = full();

    pushBack@withrevert(value);
    bool success = !lastReverted;

    // liveness
    assert success <=> !fullBefore, "never revert if not previously full";

    // effect
    assert success => back() == value, "back set to value";
    assert success => to_mathint(length()) == lengthBefore + 1, "queue increased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: pushBack preserves the previous values in the queue                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pushBackConsistency(uint256 index) {
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
    uint256 lengthBefore = length();
    bytes32 frontBefore = front@withrevert();

    bytes32 popped = popFront@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> lengthBefore != 0, "never reverts if not previously empty";

    // effect
    assert success => frontBefore == popped, "previous front is returned";
    assert success => to_mathint(length()) == lengthBefore - 1, "queue decreased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved and offset to at(x - 1) after calling popFront                                             |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popFrontConsistency(uint256 index) {
    // Read (any) value that is not the front (this asserts the value exists / the queue is long enough)
    require index > 1;
    bytes32 before = at_(index);

    popFront();

    // try to read value
    bytes32 after = at_@withrevert(require_uint256(index - 1));

    assert !lastReverted, "value still exists in the queue";
    assert before == after, "values are offset and not modified";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: popBack removes an element from the end of the queue                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBack {
    uint256 lengthBefore = length();
    bytes32 backBefore = back@withrevert();

    bytes32 popped = popBack@withrevert();
    bool success = !lastReverted;

    // liveness
    assert success <=> lengthBefore != 0, "never reverts if not previously empty";

    // effect
    assert success => backBefore == popped, "previous back is returned";
    assert success => to_mathint(length()) == lengthBefore - 1, "queue decreased";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(x) is preserved after calling popBack                                                                     |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule popBackConsistency(uint256 index) {
    // Read (any) value that is not the back (this asserts the value exists / the queue is long enough)
    require to_mathint(index) < length() - 1;
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
rule onlyEmptyOrFullRevert(env e) {
    require nonpayable(e);

    method f;
    calldataarg args;

    bool emptyBefore = empty();
    bool fullBefore = full();

    f@withrevert(e, args);

    assert lastReverted => (
        (f.selector == sig:front().selector            && emptyBefore) ||
        (f.selector == sig:back().selector             && emptyBefore) ||
        (f.selector == sig:popFront().selector         && emptyBefore) ||
        (f.selector == sig:popBack().selector          && emptyBefore) ||
        (f.selector == sig:pushFront(bytes32).selector && fullBefore ) ||
        (f.selector == sig:pushBack(bytes32).selector  && fullBefore ) ||
        f.selector == sig:at_(uint256).selector // revert conditions are verified in onlyOutOfBoundsRevert
    ), "only revert if empty or out of bounds";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at(index) only reverts if index is out of bounds                                                                  |
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyOutOfBoundsRevert(uint256 index) {
    at_@withrevert(index);

    assert lastReverted <=> index >= length(), "only reverts if index is out of bounds";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only clear/push/pop operations can change the length of the queue                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noLengthChange(env e) {
    method f;
    calldataarg args;

    uint256 lengthBefore = length();
    f(e, args);
    uint256 lengthAfter = length();

    assert lengthAfter != lengthBefore => (
        (f.selector == sig:pushFront(bytes32).selector && to_mathint(lengthAfter) == lengthBefore + 1) ||
        (f.selector == sig:pushBack(bytes32).selector  && to_mathint(lengthAfter) == lengthBefore + 1) ||
        (f.selector == sig:popBack().selector          && to_mathint(lengthAfter) == lengthBefore - 1) ||
        (f.selector == sig:popFront().selector         && to_mathint(lengthAfter) == lengthBefore - 1) ||
        (f.selector == sig:clear().selector            && lengthAfter == 0)
    ), "length is only affected by clear/pop/push operations";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: only push/pop can change values bounded in the queue (outside values aren't cleared)                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noDataChange(env e) {
    method f;
    calldataarg args;

    uint256 index;
    bytes32 atBefore = at_(index);
    f(e, args);
    bytes32 atAfter = at_@withrevert(index);
    bool atAfterSuccess = !lastReverted;

    assert !atAfterSuccess <=> (
        (f.selector == sig:clear().selector                        ) ||
        (f.selector == sig:popBack().selector  && index == length()) ||
        (f.selector == sig:popFront().selector && index == length())
    ), "indexes of the queue are only removed by clear or pop";

    assert atAfterSuccess && atAfter != atBefore => (
        f.selector == sig:popFront().selector ||
        f.selector == sig:pushFront(bytes32).selector
    ), "values of the queue are only changed by popFront or pushFront";
}
