import "helpers.spec"
import "methods/IPausable.spec"

methods {
    pause()
    unpause()
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

    // no side effect
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

    // no side effect
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only _pause and _unpause can change paused status                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noPauseChange(env e) {
    method f;
    calldataarg args;

    bool pausedBefore = paused();
    f(e, args);
    bool pausedAfter = paused();

    assert pausedBefore != pausedAfter => (
        !pausedAfter && f.selector == unpause().selector ||
        (pausedAfter && f.selector == pause().selector)
    ), "contract's paused status can only be changed by _pause() or _unpause()";
}
