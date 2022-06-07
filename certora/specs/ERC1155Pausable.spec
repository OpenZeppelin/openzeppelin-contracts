methods {
    balanceOf(address, uint256) returns uint256 envfree
    paused() returns bool envfree
}

/// When a contract is in a paused state, the token balance for a given user and
/// token must not change.
rule balancesUnchangedWhenPaused() {
    address user; uint256 token;
    uint256 balanceBefore = balanceOf(user, token);

    require paused();

    method f; calldataarg arg; env e;
    f(e, arg);

    uint256 balanceAfter = balanceOf(user, token);

    assert balanceBefore == balanceAfter, 
        "Token balance for a user must not change in a paused contract";
}

/// When a contract is in a paused state, transfer methods must revert.
rule transferMethodsRevertWhenPaused (method f)
filtered {
    f -> f.selector == safeTransferFrom(address,address,uint256,uint256,bytes).selector
      || f.selector == safeBatchTransferFrom(address,address,uint256[],uint256[],bytes).selector
}
{
    require paused();

    env e; calldataarg args;
    f@withrevert(e, args);

    assert lastReverted, 
        "Transfer methods must revert in a paused contract";
}

/// When a contract is in an unpaused state, calling pause() must pause.
rule pauseMethodPausesContract {
    require !paused();

    env e;
    pause(e);

    assert paused(), 
        "Calling pause must pause an unpaused contract";
}

/// When a contract is in a paused state, calling unpause() must unpause.
rule unpauseMethodUnpausesContract {
    require paused();

    env e;
    unpause(e);

    assert !paused(), 
        "Calling unpause must unpause a paused contract";
}

/// When a contract is in a paused state, calling pause() must revert.
rule cannotPauseWhilePaused {
    require paused();

    env e;
    pause@withrevert(e);

    assert lastReverted, 
        "A call to pause when already paused must revert";
}

/// When a contract is in an unpaused state, calling unpause() must revert.
rule cannotUnpauseWhileUnpaused {
    require !paused();

    env e;
    unpause@withrevert(e);

    assert lastReverted, 
        "A call to unpause when already unpaused must revert";
}

/// When a contract is in a paused state, functions with the whenNotPaused 
/// modifier must revert.
rule whenNotPausedModifierCausesRevertIfPaused {
    require paused();

    env e; calldataarg args;
    onlyWhenNotPausedMethod@withrevert(e, args);

    assert lastReverted, 
        "Functions with the whenNotPaused modifier must revert if the contract is paused";
}

/// When a contract is in an unpaused state, functions with the whenPaused 
/// modifier must revert.
rule whenPausedModifierCausesRevertIfUnpaused {
    require !paused();

    env e; calldataarg args;
    onlyWhenPausedMethod@withrevert(e, args);

    assert lastReverted, 
        "Functions with the whenPaused modifier must revert if the contract is not paused";
}
/*
/// This rule should always fail.
rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false, 
        "This rule should always fail";
}
*/