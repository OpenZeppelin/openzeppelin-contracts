import "helpers/helpers.spec";

methods {
    // library
    function set(bytes32,bytes32)     external returns (bool)    envfree;
    function remove(bytes32)          external returns (bool)    envfree;
    function contains(bytes32)        external returns (bool)    envfree;
    function length()                 external returns (uint256) envfree;
    function key_at(uint256)          external returns (bytes32) envfree;
    function value_at(uint256)        external returns (bytes32) envfree;
    function tryGet_contains(bytes32) external returns (bool)    envfree;
    function tryGet_value(bytes32)    external returns (bytes32) envfree;
    function get(bytes32)             external returns (bytes32) envfree;

    // FV
    function _positionOf(bytes32) external returns (uint256) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition lengthSanity() returns bool =
    length() < max_uint256;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: the value mapping is empty for keys that are not in the EnumerableMap.                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noValueIfNotContained(bytes32 key)
    !contains(key) => tryGet_value(key) == to_bytes32(0)
    {
        preserved set(bytes32 otherKey, bytes32 someValue) {
            require lengthSanity();
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: All indexed keys are contained                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant indexedContained(uint256 index)
    index < length() => contains(key_at(index))
    {
        preserved {
            requireInvariant consistencyIndex(index);
            requireInvariant consistencyIndex(require_uint256(length() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A value can only be stored at a single location                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant atUniqueness(uint256 index1, uint256 index2)
    (index1 < length() && index2 < length()) =>
    (index1 == index2 <=> key_at(index1) == key_at(index2))
    {
        preserved {
            requireInvariant consistencyIndex(index1);
            requireInvariant consistencyIndex(index2);
        }
        preserved remove(bytes32 key) {
            requireInvariant atUniqueness(index1, require_uint256(length() - 1));
            requireInvariant atUniqueness(index2, require_uint256(length() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: index <> value relationship is consistent                                                                │
│                                                                                                                     │
│ Note that the two consistencyXxx invariants, put together, prove that at_ and _positionOf are inverse of one        │
│ another. This proves that we have a bijection between indices (the enumerability part) and keys (the entries that   │
│ are set and removed from the EnumerableMap).                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant consistencyIndex(uint256 index)
    index < length() => to_mathint(_positionOf(key_at(index))) == index + 1
    {
        preserved remove(bytes32 key) {
            requireInvariant consistencyIndex(require_uint256(length() - 1));
        }
    }

invariant consistencyKey(bytes32 key)
    contains(key) => (
        _positionOf(key) > 0 &&
        _positionOf(key) <= length() &&
        key_at(require_uint256(_positionOf(key) - 1)) == key
    )
    {
        preserved {
            require lengthSanity();
        }
        preserved remove(bytes32 otherKey) {
            requireInvariant consistencyKey(otherKey);
            requireInvariant atUniqueness(
                require_uint256(_positionOf(key) - 1),
                require_uint256(_positionOf(otherKey) - 1)
            );
        }
    }

invariant absentKeyIsNotStored(bytes32 key, uint256 index)
    index < length() => (!contains(key) => key_at(index) != key)
    {
        preserved remove(bytes32 otherKey) {
            requireInvariant consistencyIndex(index);
            requireInvariant consistencyKey(key);
            requireInvariant atUniqueness(index, require_uint256(length() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: state only changes by setting or removing elements                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule stateChange(env e, bytes32 key) {
    require lengthSanity();
    requireInvariant consistencyKey(key);
    requireInvariant absentKeyIsNotStored(key, require_uint256(length() - 1));
    requireInvariant noValueIfNotContained(key);

    uint256 lengthBefore   = length();
    bool    containsBefore = contains(key);
    bytes32 valueBefore    = tryGet_value(key);

    method f;
    calldataarg args;
    f(e, args);

    uint256 lengthAfter   = length();
    bool    containsAfter = contains(key);
    bytes32 valueAfter    = tryGet_value(key);

    assert lengthBefore != lengthAfter => (
        (f.selector == sig:set(bytes32,bytes32).selector && to_mathint(lengthAfter) == lengthBefore + 1) ||
        (f.selector == sig:remove(bytes32).selector      && to_mathint(lengthAfter) == lengthBefore - 1)
    );

    assert containsBefore != containsAfter => (
        (f.selector == sig:set(bytes32,bytes32).selector && containsAfter) ||
        (f.selector == sig:remove(bytes32).selector      && !containsAfter)
    );

    assert valueBefore != valueAfter => (
        (f.selector == sig:set(bytes32,bytes32).selector && containsAfter) ||
        (f.selector == sig:remove(bytes32).selector      && !containsAfter && valueAfter == to_bytes32(0))
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: check liveness of view functions.                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule liveness_1(bytes32 key) {
    requireInvariant consistencyKey(key);
    requireInvariant noValueIfNotContained(key);

    // contains never revert
    bool contains = contains@withrevert(key);
    assert !lastReverted;

    // tryGet never reverts (key)
    tryGet_contains@withrevert(key);
    assert !lastReverted;

    // tryGet never reverts (value)
    tryGet_value@withrevert(key);
    assert !lastReverted;

    // get reverts iff the key is not in the map
    get@withrevert(key);
    assert !lastReverted <=> contains;
}

rule liveness_2(uint256 index) {
    requireInvariant consistencyIndex(index);

    // length never revert
    uint256 length = length@withrevert();
    assert !lastReverted;

    // key_at reverts iff the index is out of bound
    key_at@withrevert(index);
    assert !lastReverted <=> index < length;

    // value_at reverts iff the index is out of bound
    value_at@withrevert(index);
    assert !lastReverted <=> index < length;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: get and tryGet return the expected values.                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule getAndTryGet(bytes32 key) {
    requireInvariant noValueIfNotContained(key);

    bool    contained    = contains(key);
    bool    tryContained = tryGet_contains(key);
    bytes32 tryValue     = tryGet_value(key);
    bytes32 value        = get@withrevert(key); // revert is not contained

    assert contained == tryContained;
    assert contained => tryValue == value;
    assert !contained => tryValue == to_bytes32(0);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: set key-value in EnumerableMap                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule set(bytes32 key, bytes32 value, bytes32 otherKey) {
    require lengthSanity();

    uint256 lengthBefore        = length();
    bool    containsBefore      = contains(key);
    bool    containsOtherBefore = contains(otherKey);
    bytes32 otherValueBefore    = tryGet_value(otherKey);

    bool added = set@withrevert(key, value);
    bool success = !lastReverted;

    assert success && contains(key) && get(key) == value,
        "liveness & immediate effect";

    assert added <=> !containsBefore,
        "return value: added iff not contained";

    assert to_mathint(length()) == lengthBefore + to_mathint(added ? 1 : 0),
        "effect: length increases iff added";

    assert added => (key_at(lengthBefore) == key && value_at(lengthBefore) == value),
        "effect: add at the end";

    assert containsOtherBefore != contains(otherKey) => (added && key == otherKey),
        "side effect: other keys are not affected";

    assert otherValueBefore != tryGet_value(otherKey) => key == otherKey,
        "side effect: values attached to other keys are not affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: remove key from EnumerableMap                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule remove(bytes32 key, bytes32 otherKey) {
    requireInvariant consistencyKey(key);
    requireInvariant consistencyKey(otherKey);
    requireInvariant indexedContained(require_uint256(length() - 1));

    uint256 lengthBefore        = length();
    bool    containsBefore      = contains(key);
    bool    containsOtherBefore = contains(otherKey);
    bytes32 otherValueBefore    = tryGet_value(otherKey);

    bool removed = remove@withrevert(key);
    bool success = !lastReverted;

    assert success && !contains(key),
        "liveness & immediate effect";

    assert removed <=> containsBefore,
        "return value: removed iff contained";

    assert to_mathint(length()) == lengthBefore - to_mathint(removed ? 1 : 0),
        "effect: length decreases iff removed";

    assert containsOtherBefore != contains(otherKey) => (removed && key == otherKey),
        "side effect: other keys are not affected";

    assert otherValueBefore != tryGet_value(otherKey) => key == otherKey,
        "side effect: values attached to other keys are not affected";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: when adding a new key, the other keys remain in set, at the same index.                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule setEnumerability(bytes32 key, bytes32 value, uint256 index) {
    require lengthSanity();

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
    uint256 last = require_uint256(length() - 1);

    requireInvariant consistencyKey(key);
    requireInvariant consistencyIndex(index);
    requireInvariant consistencyIndex(last);
    requireInvariant indexedContained(index);

    bytes32 atKeyBefore     = key_at(index);
    bytes32 atValueBefore   = value_at(index);
    bytes32 lastKeyBefore   = key_at(last);
    bytes32 lastValueBefore = value_at(last);

    bool removed = remove(key);

    // can't read last value & keys (length decreased)
    bytes32 atKeyAfter = key_at@withrevert(index);
    assert lastReverted <=> (removed && index == last);

    bytes32 atValueAfter = value_at@withrevert(index);
    assert lastReverted <=> (removed && index == last);

    // Cases where a key or value can change are:
    // 1. an item was removed and we are looking at the old last index. In that case the reading reverted.
    // 2. an item was removed and we are looking at its old position. In that case the new value is the old lastValue.
    // This rule implies that if no item was removed, then keys and values cannot change.
    assert atKeyBefore != atKeyAfter => (
        (
            removed &&
            index == last
        ) || (
            removed &&
            atKeyBefore == key &&
            atKeyAfter == lastKeyBefore
        )
    );

    assert atValueBefore != atValueAfter => (
        (
            removed &&
            index == last
        ) || (
            removed &&
            atValueAfter == lastValueBefore
        )
    );
}
