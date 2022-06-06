
methods {
    totalSupply(uint256) returns uint256 envfree
    balanceOf(address, uint256) returns uint256 envfree
    exists_wrapper(uint256) returns bool envfree
}
 
/// given two different token ids, if totalSupply for one changes, then
/// totalSupply for other should not
rule token_totalSupply_independence(method f)
filtered {
    f -> f.selector != safeBatchTransferFrom(address,address,uint256[],uint256[],bytes).selector
}
{
    uint256 token1; uint256 token2;
    require token1 != token2;

    uint256 token1_before = totalSupply(token1);
    uint256 token2_before = totalSupply(token2);

    env e; calldataarg args;
    f(e, args);

    uint256 token1_after = totalSupply(token1);
    uint256 token2_after = totalSupply(token2);

    assert token1_after != token1_before => token2_after == token2_before,
        "methods must not change the total supply of more than one token";
}

/// TODO possibly show equivalence between batch and non-batch methods
/// in order to leverage non-batch rules wrt batch rules
/*
/// The result of transferring a single token must be equivalent whether done 
/// via safeTransferFrom or safeBatchTransferFrom.
rule singleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    storage beforeTransfer = lastStorage;
    env e;

    address holder; address recipient;
    uint256 token; uint256 transferAmount; bytes data;
    uint256[] tokens; uint256[] transferAmounts;

/// safeTransferFrom(address,address,uint256,uint256,bytes)
/// safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)

    mathint holderStartingBalance = balanceOf(holder, token);
    mathint recipientStartingBalance = balanceOf(recipient, token);

    require tokens.length == 1; require transferAmounts.length == 1;
    require tokens[0] == token; require transferAmounts[0] == transferAmount;

    // transferring via safeTransferFrom
    safeTransferFrom(e, holder, recipient, token, transferAmount, data) at beforeTransfer;
    mathint safeTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);

    // transferring via safeBatchTransferFrom
    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data) at beforeTransfer;
    mathint safeBatchTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);

    assert safeTransferFromBalanceChange == safeBatchTransferFromBalanceChange, 
        "Transferring a single token via safeTransferFrom or safeBatchTransferFrom must be equivalent";
}   

rule multipleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    assert false, 
    "TODO implement this rule using burn version as structural model";
}

/*

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
    env e;

    address holder; uint256 token;
    address nonHolderA; address nonHolderB;
    uint256 startingBalance = balanceOf(holder, token);
    bool startingPermissionNonHolderA = isApprovedForAll(holder, nonHolderA);
    bool startingPermissionNonHolderB = isApprovedForAll(holder, nonHolderB);
    uint256[] noTokens; uint256[] noBurnAmounts;
    require noTokens.length == 0; require noBurnAmounts.length == 0;

    burnBatch(e, holder, noTokens, noBurnAmounts);
    uint256 endingBalance = balanceOf(holder, token);
    bool endingPermissionNonHolderA = isApprovedForAll(holder, nonHolderA);
    bool endingPermissionNonHolderB = isApprovedForAll(holder, nonHolderB);

    assert startingBalance == endingBalance, 
        "burnBatch must not change token balances if passed empty arrays";
    assert startingPermissionNonHolderA == endingPermissionNonHolderA 
        && startingPermissionNonHolderB == endingPermissionNonHolderB, 
        "burnBatch must not change account permissions if passed empty arrays";
}

*/

/******************************************************************************/

ghost mapping(uint256 => mathint) sumOfBalances {
    init_state axiom forall uint256 token . sumOfBalances[token] == 0;
}

hook Sstore _balances[KEY uint256 token][KEY address user] uint256 newValue (uint256 oldValue) STORAGE {
    sumOfBalances[token] = sumOfBalances[token] + newValue - oldValue;
}

// status: not passing, because mint and burn are the same as transferring to/from
//         the 0 address.
invariant total_supply_is_sum_of_balances(uint256 token)
    sumOfBalances[token] == totalSupply(token)
    {
        preserved {
            requireInvariant balanceOfZeroAddressIsZero(token);
        }
    }
/*
rule total_supply_is_sum_of_balances_as_rule {
    uint256 token;

    require sumOfBalances[token] == totalSupply(token) + balanceOf(0, token);

    mathint sum_before = sumOfBalances[token];

    method f; calldataarg arg; env e;
    f(e, arg);

    mathint sum_after = sumOfBalances[token];

    assert sumOfBalances[token] == totalSupply(token) + balanceOf(0, token);
}
*/
/******************************************************************************/

/// The balance of a token for the zero address must be zero.
invariant balanceOfZeroAddressIsZero(uint256 token)
    balanceOf(0, token) == 0

// if a user has a token, then the token should exist

/*
hook Sload _balances[...] {
    require balance <= totalSupply
}
*/

rule held_tokens_should_exist {
    address user; uint256 token;

    requireInvariant balanceOfZeroAddressIsZero(token);

    // This assumption is safe because of total_supply_is_sum_of_balances
    require balanceOf(user, token) <= totalSupply(token);

    assert balanceOf(user, token) > 0 => exists_wrapper(token),
        "if a user's balance for a token is positive, the token must exist";
}

/******************************************************************************/

rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false;
}
