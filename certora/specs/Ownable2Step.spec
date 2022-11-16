methods {
    renounceOwnership()
    transferOwnership(address)
    acceptOwnership()
    restricted()

    owner() returns (address) envfree
    pendingOwner() returns (address) envfree
} 

definition noPendingOwner() returns bool = 
    pendingOwner() == 0;

rule transferOwnershipSetsPendingOwner(env e) {
    address newOwner;
    address currentOwner = owner();

    transferOwnership(e, newOwner);
    
    assert pendingOwner() == newOwner, "pending owner not set";
    assert owner() == currentOwner, "current owner changed";
}

rule onlyCurrentOwnerCanCallOnlyOwner(method f, env e)
    filtered { f -> 
        f.selector == renounceOwnership().selector || 
        f.selector == transferOwnership(address).selector ||
        f.selector == restricted().selector
    } {
    address currentOwner = owner();

    calldataarg args;
    f@withrevert(e, args);
    bool success = !lastReverted;
    
    assert success => e.msg.sender == currentOwner, "transfer by not owner";
}

rule onlyPendingOwnerCanAccept(env e){
    address pending = pendingOwner();

    acceptOwnership(e);

    assert e.msg.sender == pending, "accepted by not pending owner";
    assert noPendingOwner(), "pending owner not cleared";
    assert owner() == pending, "owner not transferred";
}

rule renounceDoesNotRequireTwoSteps(env e) {
    address currentOwner = owner();
    renounceOwnership(e);

    assert noPendingOwner(), "pending owner not cleared";
    assert owner() == 0, "owner not cleared";
}

rule onlyOwnerOrPendingOwnerCanChangeOwnership(env e, method f) {
    address oldOwner = owner();
    address oldPendingOwner = pendingOwner();
    
    calldataarg args;
    f(e, args);
    
    assert (owner() != oldOwner || pendingOwner() != oldPendingOwner) 
        => (e.msg.sender == oldOwner || e.msg.sender == oldPendingOwner);
    
    assert (owner() != oldOwner) => (pendingOwner() == 0);
}