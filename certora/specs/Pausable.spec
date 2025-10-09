import "helpers/helpers.spec";

methods {
    function paused() external returns (bool) envfree;
    function pause() external;
    function unpause() external;
    function onlyWhenPaused() external;
    function onlyWhenNotPaused() external;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: _pause pauses the contract                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule pause(env e) {
    require nonpayable(e);

    bool pausedBefore = paused();

    pause@withrevert(e);
    bool success = !lastReverted;

    bool pausedAfter = paused();

    // liveness
    assert success <=> !pausedBefore, "works if and only if the contract was not paused before";

    // effect
    assert success => pausedAfter, "contract must be paused after a successful call";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: _unpause unpauses the contract                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule unpause(env e) {
    require nonpayable(e);

    bool pausedBefore = paused();

    unpause@withrevert(e);
    bool success = !lastReverted;

    bool pausedAfter = paused();

    // liveness
    assert success <=> pausedBefore, "works if and only if the contract was paused before";

    // effect
    assert success => !pausedAfter, "contract must be unpaused after a successful call";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: whenPaused modifier can only be called if the contract is paused                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule whenPaused(env e) {
    require nonpayable(e);

    onlyWhenPaused@withrevert(e);
    assert !lastReverted <=> paused(), "works if and only if the contract is paused";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: whenNotPaused modifier can only be called if the contract is not paused                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule whenNotPaused(env e) {
    require nonpayable(e);

    onlyWhenNotPaused@withrevert(e);
    assert !lastReverted <=> !paused(), "works if and only if the contract is not paused";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only _pause and _unpause can change paused status                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noPauseChange(env e) {
    method f;
    calldataarg args;

    bool pausedBefore = paused();
    f(e, args);
    bool pausedAfter = paused();

    assert pausedBefore != pausedAfter => (
        (!pausedAfter && f.selector == sig:unpause().selector) ||
        (pausedAfter && f.selector == sig:pause().selector)
    ), "contract's paused status can only be changed by _pause() or _unpause()";
}
