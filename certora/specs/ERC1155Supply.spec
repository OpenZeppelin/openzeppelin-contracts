
methods {
    totalSupply(uint256) returns uint256 envfree
    balanceOf(address, uint256) returns uint256 envfree
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

invariant sum_user_token_balances_vs_totalSupply(uint256 id, address user1, address user2)
    balanceOf(user1, id) + balanceOf(user2, id) <= totalSupply(id) 
{ preserved {
    require user1 != user2;
    //for every address not user1 or user2, balance is < user1 and < user2
    require forall address user3. (user3 != user1 && user3 != user2) => balanceOf(user3, id) < balanceOf(user1, id) && balanceOf(user3, id) < balanceOf(user2, id);
    }
}

rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false;
}

