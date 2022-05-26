methods {
    balanceOf(address, uint256) returns uint256 envfree
    isApprovedForAll(address,address) returns bool envfree
}

/// If a method call reduces account balances, the caller must be either the 
/// holder of the account or approved by the holder to act on the holder's 
/// behalf.
rule onlyHolderOrApprovedCanReduceBalance {
    address holder; uint256 token; uint256 amount;
    uint256 balanceBefore = balanceOf(holder, token);

    method f; env e; calldataarg args;
    f(e, args);

    uint256 balanceAfter = balanceOf(holder, token);

    assert balanceAfter < balanceBefore => e.msg.sender == holder || isApprovedForAll(holder, e.msg.sender), 
        "An account balance may only be reduced by the holder or a holder-approved agent";
}

/// This rule should always fail.
rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false, 
        "This rule should always fail";
}
