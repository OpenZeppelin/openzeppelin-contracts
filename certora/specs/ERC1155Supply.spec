
methods {
    totalSupply(uint256) returns uint256 envfree
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


rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false;
}

