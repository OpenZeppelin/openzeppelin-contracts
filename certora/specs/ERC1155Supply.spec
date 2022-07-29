//// ## Verification of ERC1155Supply
//// 
//// `ERC1155Supply` extends the `ERC1155` functionality. The contract creates a publicly callable `totalSupply` wrapper for the private `_totalSupply` method, a public `exists` method to check for a positive balance of a given token, and updates `_beforeTokenTransfer` to appropriately change the mapping `_totalSupply` in the context of minting and burning tokens.
//// 
//// ### Assumptions and Simplifications
//// - The `exists` method was wrapped in the `exists_wrapper` method because `exists` is a keyword in CVL.
//// - The public functions `burn`, `burnBatch`, `mint`, and `mintBatch` were implemented in the harnesssing contract make their respective internal functions callable by the CVL. This was used to test the increase and decrease of `totalSupply` when tokens are minted and burned. 
//// - We created the `onlyOwner` modifier to be used in the above functions so that they are not called in unrelated rules.
//// 
//// ### Properties


methods {
    totalSupply(uint256) returns uint256 envfree
    balanceOf(address, uint256) returns uint256 envfree
    exists_wrapper(uint256) returns bool envfree
    owner() returns address envfree
}
 
/// Given two different token ids, if totalSupply for one changes, then
/// totalSupply for other must not.
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
    require e.msg.sender != owner(); // owner can call mintBatch and burnBatch in our harness
    f(e, args);

    uint256 token1_after = totalSupply(token1);
    uint256 token2_after = totalSupply(token2);

    assert token1_after != token1_before => token2_after == token2_before,
        "methods must not change the total supply of more than one token";
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
