import "helpers.spec"
import "methods/IOwnable2Step.spec"

methods {
    restricted()
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: transferOwnership sets the pending owner                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferOwnership(env e) {
    require nonpayable(e);

    address newOwner;
    address current = owner();

    transferOwnership@withrevert(e, newOwner);
    bool success = !lastReverted;

    assert success <=> e.msg.sender == current, "unauthorized caller";
    assert success => pendingOwner() == newOwner, "pending owner not set";
    assert success => owner() == current, "current owner changed";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: renounceOwnership removes the owner and the pendingOwner                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule renounceOwnership(env e) {
    require nonpayable(e);

    address current = owner();

    renounceOwnership@withrevert(e);
    bool success = !lastReverted;

    assert success <=> e.msg.sender == current, "unauthorized caller";
    assert success => pendingOwner() == 0, "pending owner not cleared";
    assert success => owner() == 0, "owner not cleared";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: acceptOwnership changes owner and reset pending owner                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule acceptOwnership(env e) {

    require nonpayable(e);

    address current = owner();
    address pending = pendingOwner();

    acceptOwnership@withrevert(e);
    bool success = !lastReverted;

    assert success <=> e.msg.sender == pending, "unauthorized caller";
    assert success => pendingOwner() == 0, "pending owner not cleared";
    assert success => owner() == pending, "owner not transferred";
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
│ Rule: ownership and pending ownership can only change in specific ways                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule ownerOrPendingOwnerChange(env e, method f) {
    address oldCurrent = owner();
    address oldPending = pendingOwner();

    calldataarg args;
    f(e, args);

    address newCurrent = owner();
    address newPending = pendingOwner();

    // If owner changes, must be either acceptOwnership or renounceOwnership
    assert oldCurrent != newCurrent => (
        (e.msg.sender == oldPending && newCurrent == oldPending && newPending == 0 && f.selector == acceptOwnership().selector) ||
        (e.msg.sender == oldCurrent && newCurrent == 0          && newPending == 0 && f.selector == renounceOwnership().selector)
    );

    // If pending changes, must be either acceptance or reset
    assert oldPending != newPending => (
        (e.msg.sender == oldCurrent && newCurrent == oldCurrent &&                    f.selector == transferOwnership(address).selector) ||
        (e.msg.sender == oldPending && newCurrent == oldPending && newPending == 0 && f.selector == acceptOwnership().selector) ||
        (e.msg.sender == oldCurrent && newCurrent == 0          && newPending == 0 && f.selector == renounceOwnership().selector)
    );
}
