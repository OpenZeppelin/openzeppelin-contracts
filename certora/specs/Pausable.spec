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
    assert success <=> pausedBefore, "works if and only if the contract was not paused before";

    // effect
    assert success => !pausedAfter, "contract must be unpaused after a successful call";

    // no side effect
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only _pause can pause                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noPause(env e) {
    method f;
    calldataarg args;

    require !paused();

    bool pausedBefore = paused();
    f(e, args);
    bool pausedAfter = paused();

    assert pausedAfter => f.selector == pause().selector, "contract must only be paused by _pause()";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only _unpause can unpause                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noUnpause(env e) {
    method f;
    calldataarg args;

    require paused();

    f(e, args);
    bool pausedAfter = paused();

    assert !pausedAfter => f.selector == unpause().selector, "contract must only be unpaused by _unpause()";
}
