import "helpers/helpers.spec";
import "methods/IAccessManaged.spec";

methods {
    // FV
    function someFunction()                       external;
    function authority_canCall_immediate(address) external returns (bool);
    function authority_canCall_delay(address)     external returns (uint32);
    function authority_getSchedule(address)       external returns (uint48);
    function _hasCode(address)                    external returns (bool) envfree;

    // Summaries
    function _.setAuthority(address)              external => DISPATCHER(true);
}

invariant isConsumingScheduledOpClean()
    isConsumingScheduledOp() == to_bytes4(0);

rule callRestrictedFunction(env e) {
    bool   immediate      = authority_canCall_immediate(e, e.msg.sender);
    uint32 delay          = authority_canCall_delay(e, e.msg.sender);
    uint48 scheduleBefore = authority_getSchedule(e, e.msg.sender);

    someFunction@withrevert(e);
    bool success = !lastReverted;

    uint48 scheduleAfter  = authority_getSchedule(e, e.msg.sender);

    // can only call if immediate, or (with delay) by consuming a scheduled op
    assert success => (
        immediate ||
        (
            delay > 0 &&
            isSetAndPast(e, scheduleBefore) &&
            scheduleAfter == 0
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Only valid authorities can be set by the current authority                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule setAuthority(env e) {
    require nonpayable(e);

    address newAuthority;

    address previousAuthority = authority();

    setAuthority@withrevert(e, newAuthority);
    bool success = !lastReverted;

    assert success <=> (
        previousAuthority == e.msg.sender &&
        _hasCode(newAuthority)
    );
    assert success => newAuthority == authority();
}
