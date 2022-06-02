
methods {
    totalSupply(uint256) returns uint256 envfree
    balanceOf(address, uint256) returns uint256 envfree
    exists_wrapper(uint256) returns bool envfree
}
 
/// given two different token ids, if totalSupply for one changes, then
/// totalSupply for other should not
rule token_totalSupply_independence(method f)
filtered {
    f -> f.selector != _burnBatch(address,uint256[],uint256[]).selector
      && f.selector != _mintBatch(address,uint256[],uint256[],bytes).selector
      && f.selector != safeBatchTransferFrom(address,address,uint256[],uint256[],bytes).selector
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
