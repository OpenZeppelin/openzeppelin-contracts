import "helpers/helpers.spec";

methods {
    function nonces(address) external returns (uint256) envfree;
    function useNonce(address) external returns (uint256) envfree;
    function useCheckedNonce(address,uint256) external returns (uint256) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function nonceSanity(address account) returns bool {
    return nonces(account) < max_uint256;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: useNonce uses nonce                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule useNonce(address account) {
    require nonceSanity(account);
    mathint nonceBefore = nonces(account);
    
    address another;
    mathint anotherNonceBefore = nonces(another);
    
    mathint nonceUsed = useNonce@withrevert(account);
    bool success = !lastReverted;

    mathint nonceAfter = nonces(account);

    // liveness
    assert success, "doesn't revert";

    // effect
    assert nonceAfter == nonceBefore + 1 && nonceBefore == nonceUsed, "nonce is used";

    // no side effect
    assert anotherNonceBefore == to_mathint(nonces(another)) || another == account, "no other nonce is used";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: useCheckedNonce uses only the current nonce                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule useCheckedNonce(address account, uint256 currentNonce) {
    require nonceSanity(account);
    mathint nonceBefore = nonces(account);

    address another;
    mathint anotherNonceBefore = nonces(another);
    
    mathint nonceUsed = useCheckedNonce@withrevert(account, currentNonce);
    bool success = !lastReverted;

    mathint nonceAfter = nonces(account);

    // liveness
    assert success <=> to_mathint(currentNonce) == nonceBefore, "works iff current nonce is correct";

    // effect
    assert success => nonceAfter == nonceBefore + 1 && nonceBefore == nonceUsed, 
      "nonce is used";

    // no side effect
    assert anotherNonceBefore == to_mathint(nonces(another)) || another == account, "no other nonce is used";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: nonce only increments                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule nonceOnlyIncrements(env e, address account) {
    require nonpayable(e);
    require nonceSanity(account);

    mathint nonceBefore = nonces(account);

    method f; calldataarg args;
    f@withrevert(e, args);

    mathint nonceAfter = nonces(account);

    assert nonceAfter >= nonceBefore, "only revert if empty or out of bounds";
}
