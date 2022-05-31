methods {
    balanceOf(address, uint256) returns uint256 envfree
    isApprovedForAll(address,address) returns bool envfree
}

/// If a method call reduces account balances, the caller must be either the 
/// holder of the account or approved to act on the holder's behalf.
rule onlyHolderOrApprovedCanReduceBalance {
    address holder; uint256 token; uint256 amount;
    uint256 balanceBefore = balanceOf(holder, token);

    method f; env e; calldataarg args;
    f(e, args);

    uint256 balanceAfter = balanceOf(holder, token);

    assert balanceAfter < balanceBefore => e.msg.sender == holder || isApprovedForAll(holder, e.msg.sender), 
        "An account balance may only be reduced by the holder or a holder-approved agent";
}

/// Burning a larger amount of a token must reduce that token's balance more 
/// than burning a smaller amount.
rule burnAmountProportionalToBalanceReduction {
    storage beforeBurn = lastStorage;
    env e;
    
    address holder; uint256 token;
    mathint startingBalance = balanceOf(holder, token); // 10
    uint256 smallBurn; uint256 largeBurn; // 4, 7
    require smallBurn < largeBurn;

    // smaller burn amount
    burn(e, holder, token, smallBurn) at beforeBurn;
    mathint smallBurnBalanceChange = startingBalance - balanceOf(holder, token); // 4

    // larger burn amount
    burn(e, holder, token, largeBurn) at beforeBurn;
    mathint largeBurnBalanceChange = startingBalance - balanceOf(holder, token); // 7

    assert smallBurnBalanceChange < largeBurnBalanceChange, 
        "A larger burn must lead to a larger decrease in balance";
}

/// Unimplemented rule to verify monotonicity of burnBatch.
rule burnBatchAmountProportionalToBalanceReduction {
    assert true, 
        "just a placeholder that should never show up";
}

/// This rule should always fail.
rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false, 
        "This rule should always fail";
}
