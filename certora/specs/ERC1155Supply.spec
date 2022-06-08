
methods {
    totalSupply(uint256) returns uint256 envfree
    balanceOf(address, uint256) returns uint256 envfree
    exists_wrapper(uint256) returns bool envfree
}
 
/// given two different token ids, if totalSupply for one changes, then
/// totalSupply for other must not
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

/// The result of transferring a single token must be equivalent whether done 
/// via safeTransferFrom or safeBatchTransferFrom.
rule singleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    storage beforeTransfer = lastStorage;
    env e;

    address holder; address recipient;
    uint256 token; uint256 transferAmount; bytes data;
    uint256[] tokens; uint256[] transferAmounts;

    mathint holderStartingBalance = balanceOf(holder, token);
    mathint recipientStartingBalance = balanceOf(recipient, token);

    require tokens.length == 1; require transferAmounts.length == 1;
    require tokens[0] == token; require transferAmounts[0] == transferAmount;

    // transferring via safeTransferFrom
    safeTransferFrom(e, holder, recipient, token, transferAmount, data) at beforeTransfer;
    mathint holderSafeTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);
    mathint recipientSafeTransferFromBalanceChange = balanceOf(recipient, token) - recipientStartingBalance;

    // transferring via safeBatchTransferFrom
    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data) at beforeTransfer;
    mathint holderSafeBatchTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);
    mathint recipientSafeBatchTransferFromBalanceChange = balanceOf(recipient, token) - recipientStartingBalance;

    assert holderSafeTransferFromBalanceChange == holderSafeBatchTransferFromBalanceChange
        && recipientSafeTransferFromBalanceChange == recipientSafeBatchTransferFromBalanceChange, 
        "Transferring a single token via safeTransferFrom or safeBatchTransferFrom must be equivalent";
}   

/// The results of transferring multiple tokens must be equivalent whether done 
/// separately via safeTransferFrom or together via safeBatchTransferFrom.
rule multipleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    storage beforeTransfers = lastStorage;
    env e;

    address holder; address recipient; bytes data;
    uint256 tokenA; uint256 tokenB; uint256 tokenC;
    uint256 transferAmountA; uint256 transferAmountB; uint256 transferAmountC;
    uint256[] tokens; uint256[] transferAmounts;

    mathint holderStartingBalanceA = balanceOf(holder, tokenA);
    mathint holderStartingBalanceB = balanceOf(holder, tokenB);
    mathint holderStartingBalanceC = balanceOf(holder, tokenC);
    mathint recipientStartingBalanceA = balanceOf(recipient, tokenA);
    mathint recipientStartingBalanceB = balanceOf(recipient, tokenB);
    mathint recipientStartingBalanceC = balanceOf(recipient, tokenC);

    require tokens.length == 3; require transferAmounts.length == 3;
    require tokens[0] == tokenA; require transferAmounts[0] == transferAmountA;
    require tokens[1] == tokenB; require transferAmounts[1] == transferAmountB;
    require tokens[2] == tokenC; require transferAmounts[2] == transferAmountC;

    // transferring via safeTransferFrom
    safeTransferFrom(e, holder, recipient, tokenA, transferAmountA, data) at beforeTransfers;
    safeTransferFrom(e, holder, recipient, tokenB, transferAmountB, data);
    safeTransferFrom(e, holder, recipient, tokenC, transferAmountC, data);
    mathint holderSafeTransferFromBalanceChangeA = holderStartingBalanceA - balanceOf(holder, tokenA);
    mathint holderSafeTransferFromBalanceChangeB = holderStartingBalanceB - balanceOf(holder, tokenB);
    mathint holderSafeTransferFromBalanceChangeC = holderStartingBalanceC - balanceOf(holder, tokenC);
    mathint recipientSafeTransferFromBalanceChangeA = balanceOf(recipient, tokenA) - recipientStartingBalanceA;
    mathint recipientSafeTransferFromBalanceChangeB = balanceOf(recipient, tokenB) - recipientStartingBalanceB;
    mathint recipientSafeTransferFromBalanceChangeC = balanceOf(recipient, tokenC) - recipientStartingBalanceC;

    // transferring via safeBatchTransferFrom
    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data) at beforeTransfers;
    mathint holderSafeBatchTransferFromBalanceChangeA = holderStartingBalanceA - balanceOf(holder, tokenA);
    mathint holderSafeBatchTransferFromBalanceChangeB = holderStartingBalanceB - balanceOf(holder, tokenB);
    mathint holderSafeBatchTransferFromBalanceChangeC = holderStartingBalanceC - balanceOf(holder, tokenC);
    mathint recipientSafeBatchTransferFromBalanceChangeA = balanceOf(recipient, tokenA) - recipientStartingBalanceA;
    mathint recipientSafeBatchTransferFromBalanceChangeB = balanceOf(recipient, tokenB) - recipientStartingBalanceB;
    mathint recipientSafeBatchTransferFromBalanceChangeC = balanceOf(recipient, tokenC) - recipientStartingBalanceC;

    assert holderSafeTransferFromBalanceChangeA == holderSafeBatchTransferFromBalanceChangeA
        && holderSafeTransferFromBalanceChangeB == holderSafeBatchTransferFromBalanceChangeB
        && holderSafeTransferFromBalanceChangeC == holderSafeBatchTransferFromBalanceChangeC
        && recipientSafeTransferFromBalanceChangeA == recipientSafeBatchTransferFromBalanceChangeA
        && recipientSafeTransferFromBalanceChangeB == recipientSafeBatchTransferFromBalanceChangeB
        && recipientSafeTransferFromBalanceChangeC == recipientSafeBatchTransferFromBalanceChangeC, 
        "Transferring multiple tokens via safeTransferFrom or safeBatchTransferFrom must be equivalent";
}

/// If transfer methods do not revert, the input arrays must be the same length.
rule transfersHaveSameLengthInputArrays {
    env e;

    address holder; address recipient; bytes data;
    uint256[] tokens; uint256[] transferAmounts;
    uint max_int = 0xffffffffffffffffffffffffffffffff;

    require tokens.length >= 0 && tokens.length <= max_int;
    require transferAmounts.length >= 0 && transferAmounts.length <= max_int;

    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data);

    uint256 tokensLength = tokens.length;
    uint256 transferAmountsLength = transferAmounts.length;

    assert tokens.length == transferAmounts.length, 
        "If transfer methods do not revert, the input arrays must be the same length";
}

/******************************************************************************/

ghost mapping(uint256 => mathint) sumOfBalances {
    init_state axiom forall uint256 token . sumOfBalances[token] == 0;
}

hook Sstore _balances[KEY uint256 token][KEY address user] uint256 newValue (uint256 oldValue) STORAGE {
    sumOfBalances[token] = sumOfBalances[token] + newValue - oldValue;
}

/// The sum of the balances over all users must equal the total supply for a 
/// given token.
invariant total_supply_is_sum_of_balances(uint256 token)
    sumOfBalances[token] == totalSupply(token)
    {
        preserved {
            requireInvariant balanceOfZeroAddressIsZero(token);
        }
    }

/******************************************************************************/

/// The balance of a token for the zero address must be zero.
invariant balanceOfZeroAddressIsZero(uint256 token)
    balanceOf(0, token) == 0

/// If a user has a token, then the token should exist.
rule held_tokens_should_exist {
    address user; uint256 token;

    requireInvariant balanceOfZeroAddressIsZero(token);

    // This assumption is safe because of total_supply_is_sum_of_balances
    require balanceOf(user, token) <= totalSupply(token);

    // note: `exists_wrapper` just calls `exists`
    assert balanceOf(user, token) > 0 => exists_wrapper(token),
        "if a user's balance for a token is positive, the token must exist";
}

/******************************************************************************/
/*
rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false;
}
*/
