import "helpers/helpers.spec";
import "methods/IAccessManaged.spec";

methods {
    // FV
    function someFunction()                 external;
    function authority_canCall_1(address)   external returns (bool);
    function authority_canCall_2(address)   external returns (uint32);
    function authority_getSchedule(address) external returns (uint48);
}

invariant isConsumingScheduledOpClean()
    isConsumingScheduledOp() == to_bytes4(0);

rule callRestrictedFunction(env e) {
    bool   immediate      = authority_canCall_1(e, e.msg.sender);
    uint32 delay          = authority_canCall_2(e, e.msg.sender);
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

    // TODO: when fixed
    // assert success => scheduleAfter == 0;
}