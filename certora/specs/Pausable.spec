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
    assert success => !pausedBefore, "unpause call must succeed if the contract was unpaused before";

    // effect
    assert success => (pausedBefore != pausedAfter && pausedAfter == true), "contract must be paused after a successful call";

    // no side effect
    assert !success => (pausedBefore == pausedAfter && pausedAfter == true), "contract must kept paused after a failed call";
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
    assert success => pausedBefore, "pause call must succeed if the contract was paused before";

    // effect
    assert success => (pausedBefore != pausedAfter && pausedAfter == false), "contract must be unpaused after a successful call";

    // no side effect
    assert !success => (pausedBefore == pausedAfter && pausedAfter == false), "contract must kept unpaused after a failed call";
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

    assert pausedBefore != pausedAfter => f.selector == pause().selector, "contract must only be paused by _pause()";
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

    bool pausedBefore = paused();
    f(e, args);
    bool pausedAfter = paused();

    assert pausedBefore != pausedAfter => f.selector == unpause().selector, "contract must only be unpaused by _unpause()";
}
