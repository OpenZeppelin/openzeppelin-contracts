import "helpers.spec"

methods {
    // library
    set(bytes32,bytes32)     returns (bool)    envfree
    remove(bytes32)          returns (bool)    envfree
    contains(bytes32)        returns (bool)    envfree
    length()                 returns (uint256) envfree
    key_at(uint256)          returns (bytes32) envfree
    value_at(uint256)        returns (bytes32) envfree
    tryGet_contains(bytes32) returns (bool)    envfree
    tryGet_value(bytes32)    returns (bytes32) envfree
    get(bytes32)             returns (bytes32) envfree

    // FV
    _indexOf(bytes32) returns (uint256) envfree
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function sanity() returns bool {
    return length() < max_uint256;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: the value mapping is empty for keys that are not in the EnumerableMap.                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noValueIfNotContained(bytes32 key)
    !contains(key) => tryGet_value(key) == 0
    {
        preserved set(bytes32 otherKey, bytes32 someValue) {
            require sanity();
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: All indexed keys are contained                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant indexedContained(uint256 index)
    contains(key_at(index))
    {
        preserved {
            requireInvariant consistencyIndex(index);
            requireInvariant consistencyIndex(to_uint256(length() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A value can only be stored at a single location                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant atUniqueness(uint256 index1, uint256 index2)
    index1 == index2 <=> key_at(index1) == key_at(index2)
    {
        preserved remove(bytes32 key) {
            requireInvariant atUniqueness(index1, to_uint256(length() - 1));
            requireInvariant atUniqueness(index2, to_uint256(length() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: index <> value relationship is consistent                                                                │
│                                                                                                                     │
│ Note that the two consistencyXxx invariants, put together, prove that at_ and _indexOf are inverse of one another.  │
│ This proves that we have a bijection between indices (the enumerability part) and keys (the entries that are set    │
│ and removed from the EnumerableMap).                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant consistencyIndex(uint256 index)
    _indexOf(key_at(index)) == index + 1
    {
        preserved remove(bytes32 key) {
            requireInvariant consistencyIndex(to_uint256(length() - 1));
        }
    }

invariant consistencyKey(bytes32 key)
    key_at(to_uint256(_indexOf(key) - 1)) == key
    {
        preserved remove(bytes32 otherKey) {
            requireInvariant consistencyKey(otherKey);
            requireInvariant atUniqueness(
                to_uint256(_indexOf(key) - 1),
                to_uint256(_indexOf(otherKey) - 1)
            );
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state only changes by setting or removing elements                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateChange(env e, bytes32 key) {
    require sanity();
    requireInvariant consistencyKey(key);

    uint256 lengthBefore   = length();
    bool    containsBefore = contains(key);
    bytes32 valueBefore    = tryGet_value(key);

    method f; calldataarg args; f(e, args);

    uint256 lengthAfter   = length();
    bool    containsAfter = contains(key);
    bytes32 valueAfter    = tryGet_value(key);

    assert lengthBefore != lengthAfter => (
        (f.selector == set(bytes32,bytes32).selector && lengthAfter == lengthBefore + 1) ||
        (f.selector == remove(bytes32).selector      && lengthAfter == lengthBefore - 1)
    );

    assert containsBefore != containsAfter => (
        (f.selector == set(bytes32,bytes32).selector && containsAfter) ||
        (f.selector == remove(bytes32).selector      && !containsAfter)
    );

    assert valueBefore != valueAfter => (
        (f.selector == set(bytes32,bytes32).selector && containsAfter) ||
        (f.selector == remove(bytes32).selector      && !containsAfter && valueAfter == 0)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: at() only returns values for bounded indexes.                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule outOfBound(uint256 index) {
    bool inBound = index < length();

    bytes32 key = key_at@withrevert(index);
    assert !lastReverted <=> inBound;

    bytes32 value = value_at@withrevert(index);
    assert !lastReverted <=> inBound;

    assert inBound => get(key) == value;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: get and tryGet return the expected values.                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getAndTryGet(bytes32 key) {
    requireInvariant noValueIfNotContained(key);

    bool contained = contains@withrevert(key);
    assert !lastReverted;

    bytes32 value = get@withrevert(key);
    assert !lastReverted <=> contained;

    bool tryContained = tryGet_contains@withrevert(key);
    assert !lastReverted;

    bytes32 tryValue = tryGet_value@withrevert(key);
    assert !lastReverted;

    assert contained == tryContained;
    assert contained => tryValue == value;
    assert !contained => tryValue == 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: set key-value in EnumerableMap                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule set(bytes32 key, bytes32 value, bytes32 otherKey) {
    require sanity();

    uint256 lengthBefore        = length();
    bool    containsBefore      = contains(key);
    bool    containsOtherBefore = contains(otherKey);
    bytes32 otherValueBefore    = tryGet_value(otherKey);

    bool added = set@withrevert(key, value);
    bool success = !lastReverted;

    // liveness & immediate effect
    assert success
        && contains(key)
        && get(key) == value;

    // return value: added iff not contained
    assert added <=> !containsBefore;

    // effect: length increases iff added
    assert length() == lengthBefore + (added ? 1 : 0);

    // effect: add at the end
    assert added => (
        key_at(lengthBefore) == key &&
        value_at(lengthBefore) == value
    );

    // side effect: other keys are not affected
    assert containsOtherBefore != contains(otherKey) => (added && key == otherKey);
    assert otherValueBefore != tryGet_value(otherKey) => key == otherKey;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: remove key from EnumerableMap                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule remove(bytes32 key, bytes32 otherKey) {
    requireInvariant consistencyKey(key);
    requireInvariant consistencyKey(otherKey);

    uint256 lengthBefore        = length();
    bool    containsBefore      = contains(key);
    bool    containsOtherBefore = contains(otherKey);
    bytes32 otherValueBefore    = tryGet_value(otherKey);

    bool removed = remove@withrevert(key);
    bool success = !lastReverted;

    // liveness & immediate effect
    assert success && !contains(key);

    // return value: removed iff contained
    assert removed <=> containsBefore;

    // effect: length decreases iff removed
    assert length() == lengthBefore - (removed ? 1 : 0);

    // side effect: other keys are not affected
    assert containsOtherBefore != contains(otherKey) => (removed && key == otherKey);
    assert otherValueBefore != tryGet_value(otherKey) => key == otherKey;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: when adding a new key, the other keys remain in set, at the same index.                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule setEnumerability(bytes32 key, bytes32 value, uint256 index) {
    require sanity();

    bytes32 atKeyBefore = key_at(index);
    bytes32 atValueBefore = value_at(index);

    set(key, value);

    bytes32 atKeyAfter = key_at@withrevert(index);
    assert !lastReverted;

    bytes32 atValueAfter = value_at@withrevert(index);
    assert !lastReverted;

    assert atKeyAfter == atKeyBefore;
    assert atValueAfter != atValueBefore => (
        key == atKeyBefore &&
        value == atValueAfter
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: when removing a existing key, the other keys remain in set, at the same index (except for the last one).      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule removeEnumerability(bytes32 key, uint256 index) {
    uint256 last = length() - 1;

    requireInvariant consistencyKey(key);
    requireInvariant consistencyIndex(index);
    requireInvariant consistencyIndex(last);

    bytes32 atKeyBefore     = key_at(index);
    bytes32 atValueBefore   = value_at(index);
    bytes32 lastKeyBefore   = key_at(last);
    bytes32 lastValueBefore = value_at(last);

    remove(key);

    // can't read last value & keys (length decreased)
    bytes32 atKeyAfter = key_at@withrevert(index);
    assert lastReverted <=> index == last;

    bytes32 atValueAfter = value_at@withrevert(index);
    assert lastReverted <=> index == last;

    // One value that is allowed to change is if previous value was removed,
    // in that case the last value before took its place.
    assert (
        index != last &&
        atKeyBefore != atKeyAfter
    ) => (
        atKeyBefore == key &&
        atKeyAfter == lastKeyBefore
    );

    assert (
        index != last &&
        atValueBefore != atValueAfter
    ) => (
        atValueAfter == lastValueBefore
    );
}
