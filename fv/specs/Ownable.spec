import "helpers/helpers.spec";
import "methods/IOwnable.spec";

methods {
    function restricted() external;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: transferOwnership changes ownership                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferOwnership(env e) {
    require nonpayable(e);

    address newOwner;
    address current = owner();

    transferOwnership@withrevert(e, newOwner);
    bool success = !lastReverted;

    assert success <=> e.msg.sender == current, "unauthorized caller";
    assert success => owner() == newOwner, "current owner changed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Access control: only current owner can call restricted functions                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyCurrentOwnerCanCallOnlyOwner(env e) {
    require nonpayable(e);

    address current = owner();

    calldataarg args;
    restricted@withrevert(e, args);

    assert !lastReverted <=> e.msg.sender == current, "access control failed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: ownership can only change through transferOwnership                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyCurrentOwnerCanChangeOwnership(env e) {
    address oldCurrent = owner();

    method f; calldataarg args;
    f(e, args);

    address newCurrent = owner();

    assert oldCurrent != newCurrent => (
        e.msg.sender == oldCurrent && f.selector == sig:transferOwnership(address).selector
    );
}
