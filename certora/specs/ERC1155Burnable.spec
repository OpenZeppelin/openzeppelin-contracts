//// ## Verification of ERC1155Burnable
//// 
//// `ERC1155Burnable` extends the `ERC1155` functionality by wrapping the internal
//// methods `_burn` and `_burnBatch` in the public methods `burn` and `burnBatch`,
//// adding a requirement that the caller of either method be the account holding
//// the tokens or approved to act on that account's behalf.
//// 
//// ### Assumptions and Simplifications
//// 
//// - No changes made using the harness
//// 
//// ### Properties

methods {
    balanceOf(address, uint256) returns uint256 envfree
    isApprovedForAll(address,address) returns bool envfree
}

/// If a method call reduces account balances, the caller must be either the 
/// holder of the account or approved to act on the holder's behalf.
rule onlyHolderOrApprovedCanReduceBalance(method f) 
{
    address holder; uint256 token; uint256 amount;
    uint256 balanceBefore = balanceOf(holder, token);

    env e; calldataarg args;
    f(e, args);

    uint256 balanceAfter = balanceOf(holder, token);

    assert balanceAfter < balanceBefore => e.msg.sender == holder || isApprovedForAll(holder, e.msg.sender), 
        "An account balance may only be reduced by the holder or a holder-approved agent";
}

/// Burning a larger amount of a token must reduce that token's balance more 
/// than burning a smaller amount.
/// n.b. This rule holds for `burnBatch` as well due to rules establishing 
/// appropriate equivance between `burn` and `burnBatch` methods.
rule burnAmountProportionalToBalanceReduction {
    storage beforeBurn = lastStorage;
    env e;
    
    address holder; uint256 token;
    mathint startingBalance = balanceOf(holder, token);
    uint256 smallBurn; uint256 largeBurn;
    require smallBurn < largeBurn;

    // smaller burn amount
    burn(e, holder, token, smallBurn) at beforeBurn;
    mathint smallBurnBalanceChange = startingBalance - balanceOf(holder, token);

    // larger burn amount
    burn(e, holder, token, largeBurn) at beforeBurn;
    mathint largeBurnBalanceChange = startingBalance - balanceOf(holder, token);

    assert smallBurnBalanceChange < largeBurnBalanceChange, 
        "A larger burn must lead to a larger decrease in balance";
}

/// Two sequential burns must be equivalent to a single burn of the sum of their
/// amounts.
/// This rule holds for `burnBatch` as well due to rules establishing 
/// appropriate equivance between `burn` and `burnBatch` methods.
rule sequentialBurnsEquivalentToSingleBurnOfSum {
    storage beforeBurns = lastStorage;
    env e;

    address holder; uint256 token;
    mathint startingBalance = balanceOf(holder, token);
    uint256 firstBurn; uint256 secondBurn; uint256 sumBurn;
    require sumBurn == firstBurn + secondBurn;

    // sequential burns
    burn(e, holder, token, firstBurn) at beforeBurns;
    burn(e, holder, token, secondBurn);
    mathint sequentialBurnsBalanceChange = startingBalance - balanceOf(holder, token);

    // burn of sum of sequential burns
    burn(e, holder, token, sumBurn) at beforeBurns;
    mathint sumBurnBalanceChange = startingBalance - balanceOf(holder, token);

    assert sequentialBurnsBalanceChange == sumBurnBalanceChange, 
        "Sequential burns must be equivalent to a burn of their sum";
}

/// The result of burning a single token must be equivalent whether done via
/// burn or burnBatch.
rule singleTokenBurnBurnBatchEquivalence {
    storage beforeBurn = lastStorage;
    env e;

    address holder;
    uint256 token; uint256 burnAmount;
    uint256[] tokens; uint256[] burnAmounts;

    mathint startingBalance = balanceOf(holder, token);

    require tokens.length == 1; require burnAmounts.length == 1;
    require tokens[0] == token; require burnAmounts[0] == burnAmount;

    // burning via burn
    burn(e, holder, token, burnAmount) at beforeBurn;
    mathint burnBalanceChange = startingBalance - balanceOf(holder, token);

    // burning via burnBatch
    burnBatch(e, holder, tokens, burnAmounts) at beforeBurn;
    mathint burnBatchBalanceChange = startingBalance - balanceOf(holder, token);

    assert burnBalanceChange == burnBatchBalanceChange, 
        "Burning a single token via burn or burnBatch must be equivalent";
}   

/// The results of burning multiple tokens must be equivalent whether done 
/// separately via burn or together via burnBatch.
rule multipleTokenBurnBurnBatchEquivalence {
    storage beforeBurns = lastStorage;
    env e;

    address holder;
    uint256 tokenA; uint256 tokenB; uint256 tokenC;
    uint256 burnAmountA; uint256 burnAmountB; uint256 burnAmountC;
    uint256[] tokens; uint256[] burnAmounts;

    mathint startingBalanceA = balanceOf(holder, tokenA);
    mathint startingBalanceB = balanceOf(holder, tokenB);
    mathint startingBalanceC = balanceOf(holder, tokenC);

    require tokens.length == 3; require burnAmounts.length == 3;
    require tokens[0] == tokenA; require burnAmounts[0] == burnAmountA;
    require tokens[1] == tokenB; require burnAmounts[1] == burnAmountB;
    require tokens[2] == tokenC; require burnAmounts[2] == burnAmountC;

    // burning via burn
    burn(e, holder, tokenA, burnAmountA) at beforeBurns;
    burn(e, holder, tokenB, burnAmountB);
    burn(e, holder, tokenC, burnAmountC);
    mathint burnBalanceChangeA = startingBalanceA - balanceOf(holder, tokenA);
    mathint burnBalanceChangeB = startingBalanceB - balanceOf(holder, tokenB);
    mathint burnBalanceChangeC = startingBalanceC - balanceOf(holder, tokenC);

    // burning via burnBatch
    burnBatch(e, holder, tokens, burnAmounts) at beforeBurns;
    mathint burnBatchBalanceChangeA = startingBalanceA - balanceOf(holder, tokenA);
    mathint burnBatchBalanceChangeB = startingBalanceB - balanceOf(holder, tokenB);
    mathint burnBatchBalanceChangeC = startingBalanceC - balanceOf(holder, tokenC);

    assert burnBalanceChangeA == burnBatchBalanceChangeA
        && burnBalanceChangeB == burnBatchBalanceChangeB
        && burnBalanceChangeC == burnBatchBalanceChangeC, 
        "Burning multiple tokens via burn or burnBatch must be equivalent";
}

/// If passed empty token and burn amount arrays, burnBatch must not change 
/// token balances or address permissions.
rule burnBatchOnEmptyArraysChangesNothing {
    uint256 token; address nonHolderA; address nonHolderB;

    uint256 startingBalance = balanceOf(nonHolderA, token);
    bool startingPermission = isApprovedForAll(nonHolderA, nonHolderB);

    env e; address holder; uint256[] noTokens; uint256[] noBurnAmounts;
    require noTokens.length == 0; require noBurnAmounts.length == 0;

    burnBatch(e, holder, noTokens, noBurnAmounts);
    
    uint256 endingBalance = balanceOf(nonHolderA, token);
    bool endingPermission = isApprovedForAll(nonHolderA, nonHolderB);

    assert startingBalance == endingBalance, 
        "burnBatch must not change token balances if passed empty arrays";
    assert startingPermission == endingPermission, 
        "burnBatch must not change account permissions if passed empty arrays";
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
